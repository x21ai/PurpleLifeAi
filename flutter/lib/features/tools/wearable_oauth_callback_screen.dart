import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/core_providers.dart';
import '../../shell/routes.dart';
import 'wearable_oauth.dart';

/// Handles OAuth callback routes for Oura and Whoop (web and universal fallback).
class WearableOAuthCallbackScreen extends ConsumerStatefulWidget {
  const WearableOAuthCallbackScreen({
    super.key,
    required this.provider,
  });

  final WearableOAuthProvider provider;

  @override
  ConsumerState<WearableOAuthCallbackScreen> createState() =>
      _WearableOAuthCallbackScreenState();
}

class _WearableOAuthCallbackScreenState
    extends ConsumerState<WearableOAuthCallbackScreen> {
  String _message = 'Connecting…';
  bool _error = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _complete());
  }

  Future<void> _complete() async {
    final oauth = WearableOAuthService(
      supabase: ref.read(supabaseClientProvider),
      worker: ref.read(workerClientProvider),
    );
    try {
      await oauth.completeFromCallbackUri(Uri.base);
      if (!mounted) return;
      setState(() {
        _error = false;
        _message = widget.provider == WearableOAuthProvider.oura
            ? 'Connected. Syncing your last 90 days…'
            : 'Connected. Backfilling your last 30 days…';
      });
      await Future<void>.delayed(const Duration(milliseconds: 900));
      if (!mounted) return;
      context.go(AppRoutes.tools);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = true;
        _message = error is StateError
            ? error.message
            : 'Something went wrong. Try connecting again from Tools.';
      });
    } finally {
      oauth.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.provider == WearableOAuthProvider.oura
        ? 'Oura Ring'
        : 'Whoop';

    return Scaffold(
      backgroundColor: const Color(0xFF120A18),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _error ? "We couldn't connect" : title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontFamily: 'Georgia',
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                _message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.65),
                      height: 1.4,
                    ),
              ),
              if (_error) ...[
                const SizedBox(height: 20),
                TextButton(
                  onPressed: () => context.go(AppRoutes.tools),
                  child: const Text('Back to Tools'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
