import 'dart:async' show unawaited;
import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/api/worker_client.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import 'health_providers.dart';
import 'health_service.dart';
import 'native_health_sync.dart';

const _freshWindow = Duration(days: 3);

enum _AppleHealthSyncState { receiving, stale, reachable, waiting }

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

class _AppleHealthPanelState extends ConsumerState<AppleHealthPanel>
    with WidgetsBindingObserver {
  bool _loaded = false;
  bool _busy = false;
  bool _authorized = false;
  bool _permissionDenied = false;
  bool _hasSyncedData = false;
  bool _loadFailed = false;
  String? _lastSyncAt;
  String? _lastDataAt;
  String? _statusReason;
  String? _lastError;

  String get _platformLabel =>
      Platform.isIOS ? 'Apple Health' : 'Health Connect';

  HealthService get _healthService => ref.read(healthServiceProvider);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refresh();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(_refresh());
    }
  }

  Future<void> _refresh() async {
    if (!isNativeHealthPlatform) {
      if (mounted) setState(() => _loaded = true);
      return;
    }

    try {
      final status = await _healthService.authorizationStatus();
      await _loadSyncTimestamps();

      if (!mounted) return;
      setState(() {
        _authorized = status.authorized;
        _permissionDenied =
            status.readDenied.isNotEmpty && !status.authorized;
        _statusReason = status.reason;
        _loadFailed = false;
        _loaded = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadFailed = true;
        _lastError = 'Could not check HealthKit status. Pull to refresh.';
        _loaded = true;
      });
    }
  }

  Future<void> _loadSyncTimestamps() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      if (!mounted) return;
      setState(() {
        _lastDataAt = null;
        _lastSyncAt = null;
        _hasSyncedData = false;
      });
      return;
    }

    final uid = session.user.id;
    final source =
        Platform.isIOS ? kAppleHealthSource : kHealthConnectSource;

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
      // Last synced UI uses apple_health_tokens.last_sync_at only (not updated_at).
      _lastSyncAt = token?['last_sync_at'] as String?;
      _hasSyncedData = _lastDataAt != null;
    });
  }

  NativeHealthSync _syncClient() {
    return ref.read(nativeHealthSyncProvider);
  }

  Future<void> _runSync(NativeHealthSync sync) async {
    final status = await _healthService.authorizationStatus();
    if (!status.authorized) {
      if (mounted) {
        setState(() {
          _authorized = false;
          _permissionDenied = status.readDenied.isNotEmpty;
          _lastError = status.reason != null
              ? _availabilityMessage(status.reason)
              : status.readDenied.isNotEmpty
                  ? 'HealthKit access is off. Open Settings, Health, and allow Purple.'
                  : 'HealthKit is not connected on this iPhone. Tap Connect to grant access.';
        });
      }
      return;
    }

    try {
      final result = await sync.readAndSync(healthService: _healthService);
      if (!mounted) return;

      if (result.empty) {
        setState(() {
          _lastError = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'No health samples yet. Wear your watch or phone and try again later.',
            ),
          ),
        );
        return;
      }

      if (result.queued) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Health data saved offline. Purple will upload when you are back online.',
            ),
          ),
        );
      } else {
        await _loadSyncTimestamps();
        if (!mounted) return;
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
      setState(() => _lastError = null);
    } on HealthServiceException catch (e) {
      if (!mounted) return;
      setState(() => _lastError = e.message);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } on WorkerApiException catch (e) {
      if (!mounted) return;
      final message = _workerSyncErrorMessage(e);
      setState(() => _lastError = message);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _lastError = 'Could not sync $_platformLabel. Try again in a moment.';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not sync $_platformLabel: $e')),
      );
    }
  }

  Future<void> _connect() async {
    setState(() {
      _busy = true;
      _permissionDenied = false;
      _lastError = null;
    });
    try {
      final availability = await _healthService.isAvailable();
      if (!availability.available) {
        if (mounted) {
          setState(() {
            _lastError = _availabilityMessage(availability.reason);
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(_availabilityMessage(availability.reason))),
          );
        }
        return;
      }

      final already = (await _healthService.authorizationStatus()).authorized;
      if (!already) {
        final granted = await _healthService.requestPermissions();
        if (!granted) {
          if (mounted) {
            setState(() {
              _authorized = false;
              _permissionDenied = true;
              _lastError =
                  'Permission denied. Open Settings, Health, and allow Purple to read vitals.';
            });
          }
          return;
        }
      }

      if (!mounted) return;
      setState(() => _authorized = true);

      await _runSync(_syncClient());

      if (mounted && _lastError == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$_platformLabel connected. Vitals synced.')),
        );
      }
    } on WorkerApiException catch (e) {
      if (mounted) {
        final message = _workerSyncErrorMessage(e);
        setState(() => _lastError = message);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    } on HealthServiceException catch (e) {
      if (mounted) {
        setState(() => _lastError = e.message);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _lastError = 'Could not sync $_platformLabel. Try again in a moment.';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not sync $_platformLabel: $e')),
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
    setState(() {
      _busy = true;
      _lastError = null;
    });
    try {
      await _runSync(_syncClient());
    } on WorkerApiException catch (e) {
      if (mounted) {
        final message = _workerSyncErrorMessage(e);
        setState(() => _lastError = message);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    } on HealthServiceException catch (e) {
      if (mounted) {
        setState(() => _lastError = e.message);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _lastError = 'Could not sync $_platformLabel. Try again in a moment.';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
        await _refresh();
      }
    }
  }

  Future<void> _openSettings() async {
    final opened = await _healthService.openHealthSettings();
    if (!opened && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Could not open Settings. Open Settings, then Health, and allow Purple.',
          ),
        ),
      );
    }
  }

  String _availabilityMessage(String? reason) {
    switch (reason) {
      case 'health_connect_unavailable':
        return 'Install or update Health Connect on this phone, then try again.';
      case 'web':
        return 'Use the Purple iOS or Android app to connect Apple Health.';
      case 'unsupported_platform':
        return 'Health sync requires the Purple iOS or Android app.';
      case 'status_check_failed':
        return 'Could not check HealthKit status. Pull to refresh.';
      default:
        if (reason != null && reason.startsWith('status_check_failed:')) {
          return 'Could not check HealthKit status. Pull to refresh.';
        }
        return 'Health data is unavailable on this device right now.';
    }
  }

  String _workerSyncErrorMessage(WorkerApiException error) {
    if (error.statusCode == 401 || error.statusCode == 403) {
      return 'Sign in again, then retry Health sync.';
    }
    if (error.statusCode >= 500) {
      return 'Purple could not save health data (${error.statusCode}). Try again in a moment.';
    }
    if (error.message == 'native_health_sync_skipped') {
      return 'Health sync is unavailable for this account right now.';
    }
    final detail = error.message.trim();
    if (detail.isNotEmpty && detail.length < 120) {
      return 'Sync failed (${error.statusCode}): $detail';
    }
    return 'Sync failed (${error.statusCode}). Check your connection and try again.';
  }

  _AppleHealthSyncState get _syncState {
    if (!_authorized) return _AppleHealthSyncState.waiting;
    final freshness = _lastSyncAt ?? _lastDataAt;
    if (freshness == null) return _AppleHealthSyncState.reachable;
    final parsed = DateTime.tryParse(freshness);
    if (parsed == null) return _AppleHealthSyncState.reachable;
    final age = DateTime.now().difference(parsed);
    if (age < _freshWindow) return _AppleHealthSyncState.receiving;
    return _AppleHealthSyncState.stale;
  }

  String _statusLine() {
    switch (_syncState) {
      case _AppleHealthSyncState.receiving:
        return _lastSyncAt != null
            ? 'Last synced ${_relativeTime(_lastSyncAt)}'
            : 'Syncing · latest vitals ${_relativeTime(_lastDataAt)}';
      case _AppleHealthSyncState.stale:
        return _lastSyncAt != null
            ? 'Last synced ${_relativeTime(_lastSyncAt)} · open Purple to refresh from HealthKit'
            : 'Last vitals ${_relativeTime(_lastDataAt)} · open Purple to refresh from HealthKit';
      case _AppleHealthSyncState.reachable:
        return 'Connected · waiting for the first HealthKit sync';
      case _AppleHealthSyncState.waiting:
        if (_hasSyncedData) {
          return 'Account has older Apple Health data · connect HealthKit on this iPhone';
        }
        return 'Not connected · grant HealthKit access to sync vitals';
    }
  }

  String _relativeTime(String? iso) {
    if (iso == null) return 'never';
    final parsed = DateTime.tryParse(iso);
    if (parsed == null) return 'never';
    final diff = DateTime.now().difference(parsed);
    final minutes = diff.inMinutes;
    if (minutes < 1) return 'just now';
    if (minutes < 60) return '$minutes min ago';
    final hours = (minutes / 60).round();
    if (hours < 24) return '${hours}h ago';
    return '${(hours / 24).round()}d ago';
  }

  Color _statusDotColor() {
    switch (_syncState) {
      case _AppleHealthSyncState.receiving:
        return Colors.green.shade400;
      case _AppleHealthSyncState.stale:
        return const Color(0xFFEAB308);
      case _AppleHealthSyncState.reachable:
      case _AppleHealthSyncState.waiting:
        return Colors.white.withValues(alpha: 0.45);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!isNativeHealthPlatform) {
      return _NonNativeEmptyState(embedded: widget.embedded);
    }

    if (widget.embedded) {
      return _embeddedBody(context);
    }

    final inner =
        _authorized ? _connectedBody(context) : _connectBody(context);

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_authorized && _loaded) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  color: Colors.green.withValues(alpha: 0.12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle,
                        size: 14, color: Colors.green.shade300),
                    const SizedBox(width: 6),
                    Text(
                      'Connected',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Colors.green.shade200,
                          ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          inner,
        ],
      ),
    );
  }

  Widget _embeddedBody(BuildContext context) {
    final subtitle = !_loaded
        ? 'Checking status'
        : _loadFailed
            ? 'Status unavailable'
            : _statusLine();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.08),
              ),
              child: Icon(
                _authorized ? Icons.favorite : Icons.smartphone,
                size: 18,
                color: _authorized
                    ? Colors.green.shade300
                    : Colors.white.withValues(alpha: 0.85),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _platformLabel,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontFamily: 'Georgia',
                          color: Colors.white.withValues(alpha: 0.92),
                        ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      if (_loaded && !_loadFailed) ...[
                        Container(
                          width: 6,
                          height: 6,
                          margin: const EdgeInsets.only(right: 6),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _statusDotColor(),
                          ),
                        ),
                      ],
                      Expanded(
                        child: Text(
                          subtitle,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.55),
                                  ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (_loaded && !_authorized)
              FilledButton(
                onPressed: _busy ? null : _connect,
                style: FilledButton.styleFrom(
                  minimumSize: const Size(88, 44),
                  shape: const StadiumBorder(),
                ),
                child: _busy
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(Platform.isIOS ? 'Connect' : 'Connect'),
              ),
          ],
        ),
        if (_authorized) ...[
          const SizedBox(height: 14),
          Row(
            children: [
              OutlinedButton(
                onPressed: _busy ? null : _syncNow,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(72, 44),
                ),
                child: _busy
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Sync'),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: _openSettings,
                style: TextButton.styleFrom(
                  minimumSize: const Size(88, 44),
                  foregroundColor: Colors.white.withValues(alpha: 0.7),
                ),
                child: const Text('Settings'),
              ),
            ],
          ),
        ] else if (_loaded) ...[
          const SizedBox(height: 10),
          Text(
            Platform.isIOS
                ? 'Grant HealthKit access to sync sleep, HRV, steps, and heart rate from this iPhone.'
                : 'Grant Health Connect access to sync vitals from this phone.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.45),
                  height: 1.4,
                ),
          ),
          if (!_authorized) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: _openSettings,
                child: const Text('Open Health Settings'),
              ),
            ),
          ],
        ],
        if (_permissionDenied || _lastError != null) ...[
          const SizedBox(height: 12),
          Text(
            _lastError ??
                'Permission denied. Open Settings, Health, and allow Purple to read vitals.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color(0xFFEAB308),
                  height: 1.4,
                ),
          ),
        ],
        if (_loadFailed) ...[
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(onPressed: _refresh, child: const Text('Retry')),
          ),
        ],
        if (_statusReason != null && !_authorized && !_permissionDenied) ...[
          const SizedBox(height: 8),
          Text(
            _availabilityMessage(_statusReason),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.45),
                ),
          ),
        ],
        if (_loaded &&
            _hasSyncedData &&
            !_authorized &&
            !_permissionDenied) ...[
          const SizedBox(height: 12),
          _WebImportNote(platformLabel: _platformLabel),
        ],
      ],
    );
  }

  Widget _connectBody(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(Icons.smartphone,
            size: 48, color: Colors.white.withValues(alpha: 0.7)),
        const SizedBox(height: 16),
        Text(
          _platformLabel,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontFamily: 'Georgia',
                color: Colors.white.withValues(alpha: 0.95),
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          Platform.isIOS
              ? 'Purple reads sleep, HRV, heart rate, and steps directly from HealthKit on this iPhone.'
              : 'Purple reads sleep, HRV, heart rate, and steps from Health Connect on this phone.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.7),
              ),
          textAlign: TextAlign.center,
        ),
        if (_loaded && _hasSyncedData && !_permissionDenied) ...[
          const SizedBox(height: 16),
          _WebImportNote(platformLabel: _platformLabel),
        ],
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
                : Text('Connect $_platformLabel'),
          ),
        ),
        const SizedBox(height: 12),
        TextButton(onPressed: _openSettings, child: const Text('Open Settings')),
        if (_permissionDenied || _lastError != null) ...[
          const SizedBox(height: 16),
          Text(
            _lastError ??
                'Health access was not granted. Open Health Settings, tap Purple, and turn on the data you want to share.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color(0xFFEAB308),
                ),
            textAlign: TextAlign.center,
          ),
        ],
        if (_loaded) ...[
          const SizedBox(height: 16),
          Text(
            Platform.isIOS
                ? 'Tap Connect to open the iOS Health Access sheet, or use Health Settings to allow or deny access.'
                : 'Tap Connect to open Health Connect permissions for Purple.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.45),
                  height: 1.4,
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
          _platformLabel,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontFamily: 'Georgia',
                color: Colors.white.withValues(alpha: 0.95),
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _statusDotColor(),
              ),
            ),
            Flexible(
              child: Text(
                _loaded ? _statusLine() : '',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.7),
                    ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
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
        TextButton(
          onPressed: _openSettings,
          child: const Text('Open Health Settings'),
        ),
        const SizedBox(height: 8),
        Text(
          'Open Purple after workouts or sleep to refresh vitals. Use Health Settings to change what Purple can read.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.45),
                height: 1.4,
              ),
          textAlign: TextAlign.center,
        ),
        if (_lastError != null) ...[
          const SizedBox(height: 12),
          Text(
            _lastError!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color(0xFFEAB308),
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}

class _WebImportNote extends StatelessWidget {
  const _WebImportNote({required this.platformLabel});

  final String platformLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: Colors.white.withValues(alpha: 0.05),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Text(
        Platform.isIOS
            ? 'Previous data in your account may be from web import or Health Auto Export. '
                'Tap Connect to link HealthKit on this iPhone.'
            : 'Previous data in your account may be from another device. '
                'Tap Connect to link Health Connect on this phone.',
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.55),
              height: 1.4,
            ),
      ),
    );
  }
}

class _NonNativeEmptyState extends StatelessWidget {
  const _NonNativeEmptyState({required this.embedded});

  final bool embedded;

  @override
  Widget build(BuildContext context) {
    if (embedded) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.08),
            ),
            child: Icon(
              Icons.smartphone,
              size: 18,
              color: Colors.white.withValues(alpha: 0.85),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Apple Health',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontFamily: 'Georgia',
                        color: Colors.white.withValues(alpha: 0.92),
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Install the Purple iOS app to connect HealthKit directly. '
                  'On web, use Health Auto Export at purplelife.org/tools.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                        height: 1.4,
                      ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return const Padding(
      padding: EdgeInsets.only(top: 16),
      child: EmptyState(
        eyebrow: 'Native only',
        title: 'Connect on your phone',
        body:
            'Apple Health and Health Connect require the Purple iOS or Android app. '
            'Install the native app on your phone to grant HealthKit or Health Connect access.',
      ),
    );
  }
}