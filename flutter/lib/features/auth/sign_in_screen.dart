import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/auth/auth_repository.dart';
import '../../core/providers/core_providers.dart';
import '../../design/glass_card.dart';
import '../../design/purple_theme.dart';
import '../../design/tokens.dart';
import '../shared/glass_helpers.dart' hide GlassCard;

/// Email/password and OAuth sign-in using Supabase auth.
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  static const _foreground = purpleForegroundDark;
  static const _foregroundMuted = Color(0x8CFFFFFF);
  static const _foregroundSubtle = Color(0x8FFFFFFF);

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isRegister = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<AuthRepository> _auth() async {
    return ref.read(authRepositoryProvider.future);
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Enter email and password.');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final auth = await _auth();
      if (_isRegister) {
        await auth.signUpWithEmail(email: email, password: password);
      } else {
        await auth.signInWithEmail(email: email, password: password);
      }
      if (!mounted) return;
      context.go('/today');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _oauth(OAuthProvider provider) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final auth = await _auth();
      await auth.signInWithOAuth(provider);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authReady = ref.watch(authRepositoryProvider);
    final themeExt = Theme.of(context).extension<PurpleThemeExtension>();
    final titleColor = themeExt != null
        ? parseTokenColor(themeExt.colors.textPrimary)
        : _foreground;
    final subtitleColor = themeExt != null
        ? parseTokenColor(themeExt.colors.textTertiary)
        : _foregroundSubtle;

    return Scaffold(
      backgroundColor: purpleCanvasDark,
      body: CanvasBackground(
        auth: true,
        child: SafeArea(
          child: ContentColumn(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: authReady.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: Color(0xFFB084D1)),
              ),
              error: (error, _) => Text(
                'Auth init failed: $error',
                style: const TextStyle(color: _foreground),
              ),
              data: (_) => Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Purple',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontFamily: 'Georgia',
                          fontWeight: FontWeight.w600,
                          letterSpacing: 4.8,
                          color: titleColor,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isRegister ? 'Create your account' : 'Sign in',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: subtitleColor,
                        ),
                  ),
                  const SizedBox(height: 32),
                  GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          autofillHints: const [AutofillHints.email],
                          style: const TextStyle(color: _foreground),
                          decoration: const InputDecoration(
                            labelText: 'Email',
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          autofillHints: const [AutofillHints.password],
                          style: const TextStyle(color: _foreground),
                          decoration: const InputDecoration(
                            labelText: 'Password',
                          ),
                          onSubmitted: (_) => _busy ? null : _submit(),
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
                          onPressed: _busy ? null : _submit,
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(48),
                          ),
                          child: Text(
                            _busy
                                ? 'Please wait…'
                                : _isRegister
                                    ? 'Create account'
                                    : 'Sign in',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : () => _oauth(OAuthProvider.google),
                    icon: const Icon(Icons.g_mobiledata, size: 28),
                    label: const Text('Continue with Google'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : () => _oauth(OAuthProvider.apple),
                    icon: const Icon(Icons.apple),
                    label: const Text('Continue with Apple'),
                  ),
                  const SizedBox(height: 24),
                  TextButton(
                    onPressed: _busy
                        ? null
                        : () => setState(() {
                              _isRegister = !_isRegister;
                              _error = null;
                            }),
                    style: TextButton.styleFrom(foregroundColor: _foregroundMuted),
                    child: Text(
                      _isRegister
                          ? 'Already have an account? Sign in'
                          : 'Need an account? Create one',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
