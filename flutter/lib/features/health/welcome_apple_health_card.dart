import 'dart:async' show unawaited;
import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/worker_client.dart';
import '../auth/ploy_access_chrome.dart';
import 'health_providers.dart';
import 'health_service.dart';

/// Optional onboarding connect row (web `WelcomeAppleHealthConnect`).
class WelcomeAppleHealthCard extends ConsumerStatefulWidget {
  const WelcomeAppleHealthCard({super.key, this.onConnected});

  final VoidCallback? onConnected;

  @override
  ConsumerState<WelcomeAppleHealthCard> createState() =>
      _WelcomeAppleHealthCardState();
}

class _WelcomeAppleHealthCardState
    extends ConsumerState<WelcomeAppleHealthCard> {
  bool _loaded = false;
  bool _busy = false;
  bool _authorized = false;

  @override
  void initState() {
    super.initState();
    if (isNativeHealthPlatform) {
      unawaited(_refresh());
    }
  }

  Future<void> _refresh() async {
    final status = await ref.read(healthServiceProvider).authorizationStatus();
    if (!mounted) return;
    setState(() {
      _authorized = status.authorized;
      _loaded = true;
    });
    if (status.authorized) {
      widget.onConnected?.call();
    }
  }

  Future<void> _connect() async {
    setState(() => _busy = true);
    try {
      final health = ref.read(healthServiceProvider);
      final availability = await health.isAvailable();
      if (!availability.available) {
        if (!mounted) return;
        final message = _availabilityMessage(availability.reason);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
        return;
      }

      final already = (await health.authorizationStatus()).authorized;
      if (!already) {
        final granted = await health.requestPermissions();
        if (!granted) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Permission denied. Open Settings, Health, and allow Purple to read vitals.',
              ),
            ),
          );
          return;
        }
      }

      final sync = ref.read(nativeHealthSyncProvider);
      final result = await sync.readAndSync(healthService: health);
      if (result.empty && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'No health samples yet. Wear your watch or phone and try again later.',
            ),
          ),
        );
      }

      if (!mounted) return;
      setState(() => _authorized = true);
      widget.onConnected?.call();
    } on HealthServiceException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } on WorkerApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_workerSyncErrorMessage(error))),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not connect Apple Health: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _busy = false);
        await _refresh();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!isNativeHealthPlatform) return const SizedBox.shrink();
    if (_authorized) return const SizedBox.shrink();

    return PloyAccessCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: PloyAccessColors.tint,
                ),
                child: const Icon(
                  Icons.smartphone,
                  color: PloyAccessColors.accent,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      Platform.isIOS ? 'Apple Health' : 'Health Connect',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: PloyAccessColors.ink,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Sleep, heart rate, steps, and more from this phone',
                      style: TextStyle(
                        fontSize: 12,
                        height: 1.35,
                        color: PloyAccessColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          PloyAccentButton(
            label: _busy
                ? 'Please wait…'
                : Platform.isIOS
                    ? 'Connect Apple Health'
                    : 'Connect Health Connect',
            showArrow: false,
            onPressed: _loaded && !_busy ? _connect : null,
          ),
        ],
      ),
    );
  }

  String _availabilityMessage(String? reason) {
    switch (reason) {
      case 'health_connect_unavailable':
        return 'Install or update Health Connect on this phone, then try again.';
      default:
        return 'Health data is unavailable on this device right now.';
    }
  }

  String _workerSyncErrorMessage(WorkerApiException error) {
    if (error.statusCode == 401 || error.statusCode == 403) {
      return 'Sign in again, then retry Health sync.';
    }
    return 'Sync failed (${error.statusCode}). Check your connection and try again.';
  }
}
