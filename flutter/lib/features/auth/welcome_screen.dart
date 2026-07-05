import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/core_providers.dart';
import '../../design/glass_card.dart';
import '../../design/purple_theme.dart';
import '../../shell/routes.dart';
import '../health/welcome_apple_health_card.dart';
import '../shared/glass_helpers.dart' hide GlassCard;

/// Lightweight onboarding gate for users without profile onboarding metadata.
class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  final _firstNameController = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _firstNameController.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final client = ref.read(supabaseClientProvider);
      final user = client.auth.currentUser;
      if (user == null) {
        if (!mounted) return;
        context.go(AppRoutes.signIn);
        return;
      }

      final firstName = _firstNameController.text.trim();
      await client.from('profiles').upsert({
        'id': user.id,
        'first_name': firstName.isEmpty ? null : firstName,
        'onboarded_at': DateTime.now().toUtc().toIso8601String(),
      }, onConflict: 'id');

      if (!mounted) return;
      context.go(AppRoutes.today);
    } catch (error, stack) {
      debugPrint('[WelcomeScreen] onboarding save failed: $error\n$stack');
      if (!mounted) return;
      setState(() {
        _error = 'Could not finish setup. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final subtitleColor = Colors.white.withValues(alpha: 0.82);

    return Scaffold(
      backgroundColor: purpleCanvasDark,
      body: CanvasBackground(
        auth: true,
        child: SafeArea(
          child: ContentColumn(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Welcome to Purple',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'This quick setup keeps Flutter preview routing aligned with production.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: subtitleColor,
                      ),
                ),
                const SizedBox(height: 24),
                WelcomeAppleHealthCard(
                  onConnected: () {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Apple Health connected. Vitals synced.'),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'First name (optional)',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                              color: Colors.white.withValues(alpha: 0.9),
                            ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _firstNameController,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _saving ? null : _completeOnboarding(),
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(
                          hintText: 'How should Purple address you?',
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          _error!,
                          style: const TextStyle(color: Color(0xFFE8745C)),
                        ),
                      ],
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: _saving ? null : _completeOnboarding,
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                        ),
                        child: Text(_saving ? 'Saving...' : 'Continue to Today'),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: _saving ? null : _completeOnboarding,
                        child: const Text('Skip name for now'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
