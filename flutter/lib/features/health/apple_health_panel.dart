import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/api/worker_client.dart';
import '../../core/providers/core_providers.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import 'health_service.dart';
import 'native_health_sync.dart';

/// Tools/settings panel for Apple Health (iOS) or Health Connect (Android).
///
/// Web and desktop show a connect prompt empty state (no platform APIs).
class AppleHealthPanel extends ConsumerStatefulWidget {
  const AppleHealthPanel({super.key, this.embedded = false});

  /// When true, omit outer section chrome (for Tools list card).
  final bool embedded;

  @override
  ConsumerState<AppleHealthPanel> createState() => _AppleHealthPanelState();
}

class _AppleHealthPanelState extends ConsumerState<AppleHealthPanel> {
  final _healthService = HealthService();

  bool _loaded = false;
  bool _busy = false;
  bool _authorized = false;
  bool _permissionDenied = false;
  String? _lastSyncAt;
  String? _lastDataAt;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    if (!isNativeHealthPlatform) {
      if (mounted) setState(() => _loaded = true);
      return;
    }

    final status = await _healthService.authorizationStatus();
    await _loadSyncTimestamps();

    if (!mounted) return;
    setState(() {
      _authorized = status.authorized;
      _permissionDenied = status.readDenied.isNotEmpty && !status.authorized;
      _loaded = true;
    });
  }

  Future<void> _loadSyncTimestamps() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    final uid = session.user.id;
    final source =
        Platform.isIOS ? kAppleHealthSource : kHealthConnectSource;

    try {
      final bio = await Supabase.instance.client
          .from('biometrics')
          .select('recorded_at')
          .eq('user_id', uid)
          .eq('source', source)
          .order('recorded_at', ascending: false)
          .limit(1)
          .maybeSingle();

      final token = await Supabase.instance.client
          .from('apple_health_tokens')
          .select('last_sync_at')
          .eq('user_id', uid)
          .maybeSingle();

      if (!mounted) return;
      setState(() {
        _lastDataAt = bio?['recorded_at'] as String?;
        _lastSyncAt = token?['last_sync_at'] as String?;
      });
    } catch (_) {
      // Offline or schema unavailable; panel still renders connect UI.
    }
  }

  Future<void> _runSync(NativeHealthSync sync) async {
    final status = await _healthService.authorizationStatus();
    if (!status.authorized) {
      if (mounted) {
        setState(() {
          _authorized = false;
          _permissionDenied = true;
        });
      }
      return;
    }

    final result = await sync.readAndSync(healthService: _healthService);
    if (result.empty && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'No health samples yet. Wear your watch or phone and try again later.',
          ),
        ),
      );
    } else if (mounted) {
      setState(() => _lastSyncAt = DateTime.now().toUtc().toIso8601String());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result.upserted > 0
                ? 'Health sync complete (${result.upserted} days).'
                : 'Health sync complete.',
          ),
        ),
      );
    }
  }

  Future<void> _connect() async {
    setState(() {
      _busy = true;
      _permissionDenied = false;
    });
    try {
      final already = (await _healthService.authorizationStatus()).authorized;
      if (!already) {
        final granted = await _healthService.requestPermissions();
        if (!granted) {
          if (mounted) {
            setState(() {
              _authorized = false;
              _permissionDenied = true;
            });
          }
          return;
        }
      }

      if (!mounted) return;
      setState(() => _authorized = true);

      final sync = NativeHealthSync(workerClient: ref.read(workerClientProvider));
      await _runSync(sync);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Apple Health connected. Vitals synced.')),
        );
      }
    } on WorkerApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sync failed: ${e.message}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not sync Apple Health: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
        await _refresh();
      }
    }
  }

  Future<void> _syncNow() async {
    setState(() => _busy = true);
    try {
      final sync = NativeHealthSync(workerClient: ref.read(workerClientProvider));
      await _runSync(sync);
    } on WorkerApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sync failed: ${e.message}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
        await _refresh();
      }
    }
  }

  String _statusLine() {
    final freshness = _lastSyncAt ?? _lastDataAt;
    if (freshness == null) {
      return _authorized
          ? 'Connected, waiting for the first sync'
          : 'Not connected';
    }
    return 'Last synced ${_relativeTime(freshness)}';
  }

  String _relativeTime(String iso) {
    final diff = DateTime.now().difference(DateTime.parse(iso));
    final minutes = diff.inMinutes;
    if (minutes < 1) return 'just now';
    if (minutes < 60) return '$minutes min ago';
    final hours = (minutes / 60).round();
    if (hours < 24) return '${hours}h ago';
    return '${(hours / 24).round()}d ago';
  }

  @override
  Widget build(BuildContext context) {
    if (!isNativeHealthPlatform) {
      return _NonNativeEmptyState(embedded: widget.embedded);
    }

    final inner = _authorized ? _connectedBody(context) : _connectBody(context);

    if (widget.embedded) {
      return Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: inner);
    }

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: inner,
    );
  }

  Widget _connectBody(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(Icons.smartphone, size: 48, color: Colors.white.withValues(alpha: 0.7)),
        const SizedBox(height: 16),
        Text(
          'Apple Health',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontFamily: 'Georgia',
                color: Colors.white.withValues(alpha: 0.95),
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Grant access to sleep, HRV, steps, and heart rate so Purple can spot patterns.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.7),
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: 280,
          child: FilledButton(
            onPressed: _loaded && !_busy ? _connect : null,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              shape: const StadiumBorder(),
            ),
            child: _busy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Connect Apple Health'),
          ),
        ),
        if (_permissionDenied) ...[
          const SizedBox(height: 16),
          Text(
            'Permission denied. Open Settings, Health, and allow Purple to read vitals.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color(0xFFEAB308),
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }

  Widget _connectedBody(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(Icons.favorite, size: 48, color: Colors.green.shade300),
        const SizedBox(height: 16),
        Text(
          'Apple Health',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontFamily: 'Georgia',
                color: Colors.white.withValues(alpha: 0.95),
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          _loaded ? _statusLine() : '',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.7),
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: 280,
          child: FilledButton(
            onPressed: _loaded && !_busy ? _syncNow : null,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              shape: const StadiumBorder(),
            ),
            child: _busy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Sync now'),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Open Settings, Health, to change which metrics Purple can read.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.55),
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _NonNativeEmptyState extends StatelessWidget {
  const _NonNativeEmptyState({required this.embedded});

  final bool embedded;

  @override
  Widget build(BuildContext context) {
    const state = EmptyState(
      eyebrow: 'Native only',
      title: 'Connect on your phone',
      body:
          'Apple Health and Health Connect require the Purple iOS or Android app. '
          'Install the native app on your phone to grant HealthKit or Health Connect access.',
    );

    if (embedded) return state;
    return const Padding(
      padding: EdgeInsets.only(top: 16),
      child: state,
    );
  }
}
