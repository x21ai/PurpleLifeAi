import 'dart:async' show unawaited;
import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

class _WelcomeAppleHealthCardState extends ConsumerState<WelcomeAppleHealthCard> {
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
    final status =
        await ref.read(healthServiceProvider).authorizationStatus();
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
      final already = (await health.authorizationStatus()).authorized;
      if (!already) {
        final granted = await health.requestPermissions();
        if (!granted) return;
      }

      final sync = ref.read(nativeHealthSyncProvider);
      await sync.readAndSync(healthService: health);

      if (!mounted) return;
      setState(() => _authorized = true);
      widget.onConnected?.call();
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

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        color: Colors.white.withValues(alpha: 0.04),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.08),
            ),
            child: Icon(
              Icons.smartphone,
              color: Colors.white.withValues(alpha: 0.85),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  Platform.isIOS ? 'Apple Health' : 'Health Connect',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.92),
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Sleep, heart rate, steps, and more from this phone',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                        height: 1.35,
                      ),
                ),
              ],
            ),
          ),
          FilledButton(
            onPressed: _loaded && !_busy ? _connect : null,
            child: _busy
                ? const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(
                    Platform.isIOS
                        ? 'Connect Apple Health'
                        : 'Connect Health Connect',
                  ),
          ),
        ],
      ),
    );
  }
}
