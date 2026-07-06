import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth/auth_state.dart';
import '../../core/auth/auth_repository.dart';
import '../../core/providers/core_providers.dart';
import '../../design/glass_card.dart';
import '../../design/purple_theme.dart';
import '../../design/tokens.dart';
import '../shared/glass_helpers.dart' hide GlassCard;

/// Maps a raw Supabase auth error to user-facing copy.
///
/// Mirrors the intent of web's `friendlyAuthError` (`src/routes/sign-in.tsx`):
/// never show a raw exception string. Supabase Auth API error text and error
/// codes come from the same backend regardless of SDK, so the same
/// message/code checks apply here.
String friendlyAuthError(Object error) {
  if (error is AuthException) {
    final code = error.code;
    final message = error.message.toLowerCase();

    if (code == 'email_not_confirmed' ||
        message.contains('email not confirmed')) {
      return 'Please confirm your email first. Check your inbox for the link.';
    }
    if (code == 'user_already_exists' ||
        code == 'email_exists' ||
        message.contains('already registered') ||
        message.contains('user already registered') ||
        message.contains('already exists')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    if (error is AuthWeakPasswordException || code == 'weak_password') {
      return 'That password is too weak. Use at least 8 characters with a mix of letters and numbers.';
    }
    if (code == 'over_email_send_rate_limit' ||
        code == 'over_request_rate_limit' ||
        code == 'over_sms_send_rate_limit' ||
        message.contains('rate limit')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (message.contains('invalid login credentials') ||
        message.contains('user not found') ||
        message.contains('invalid email or password')) {
      return 'Email or password is incorrect.';
    }
    if (error is AuthRetryableFetchException ||
        message.contains('failed host lookup') ||
        message.contains('socketexception') ||
        message.contains('network')) {
      return 'Network error. Check your connection and try again.';
    }
    // Fall back to the server message: it is already human-readable copy
    // from the Supabase Auth API, just not one of the cases mapped above.
    return error.message;
  }
  final raw = error.toString().toLowerCase();
  if (raw.contains('socketexception') ||
      raw.contains('network') ||
      raw.contains('failed host lookup')) {
    return 'Network error. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

/// Email/password and OAuth sign-in using Supabase auth.
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({this.resetLinkExpired = false, super.key});

  /// Set when routing from `/sign-in?reset=expired` (expired recovery deep link).
  final bool resetLinkExpired;

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  static const _foreground = purpleForegroundDark;
  static const _foregroundMuted = Color(0x8CFFFFFF);
  static const _foregroundSubtle = Color(0x8FFFFFFF);

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordFocusNode = FocusNode();
  bool _isRegister = false;
  bool _showPassword = false;
  bool _busy = false;
  bool _resetSent = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.resetLinkExpired) {
      _error =
          'That reset link expired or was already used. Request a new one below, or sign in if you already set a password.';
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _passwordFocusNode.dispose();
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
        final response =
            await auth.signUpWithEmail(email: email, password: password);
        // With email confirmations enabled, Supabase protects against email
        // enumeration: signUp for an existing confirmed email "succeeds"
        // with an obfuscated user that has no identities, rather than
        // returning an error (mirrors web `sign-in.tsx` `showAlreadyRegistered`).
        final identities = response.user?.identities;
        if (response.session == null &&
            response.user != null &&
            (identities == null || identities.isEmpty)) {
          if (!mounted) return;
          setState(() {
            _isRegister = false;
            _error =
                'An account with this email already exists. Try signing in instead.';
            _busy = false;
          });
          return;
        }
      } else {
        await auth.signInWithEmail(email: email, password: password);
        ref.read(invalidateSessionDataProvider)();
      }
      if (!mounted) return;
      context.go('/today');
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = friendlyAuthError(e));
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
      if (!mounted) return;
      setState(() => _error = friendlyAuthError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _forgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Enter your email above first, then tap "Forgot password?" again.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final auth = await _auth();
      await auth.resetPasswordForEmail(email);
      if (!mounted) return;
      setState(() => _resetSent = true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = friendlyAuthError(e));
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
    final errorColor = Theme.of(context).colorScheme.error;
    final spacing = (themeExt?.tokens ?? PurpleTokens.fallback).spacing;

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
                          fontFamily: PurpleType.serif,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 4.8,
                          color: titleColor,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _resetSent
                        ? 'Reset your password'
                        : _isRegister
                            ? 'Create your account'
                            : 'Sign in',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: subtitleColor,
                        ),
                  ),
                  const SizedBox(height: 32),
                  if (_resetSent)
                    GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Check your inbox',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(color: titleColor),
                          ),
                          SizedBox(height: spacing.xs),
                          Text(
                            'We sent a password reset link to '
                            '${_emailController.text.trim()}. Follow it to '
                            'choose a new password, then come back and sign in.',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: subtitleColor),
                          ),
                          SizedBox(height: spacing.md),
                          TextButton(
                            onPressed: () => setState(() {
                              _resetSent = false;
                              _error = null;
                            }),
                            style:
                                TextButton.styleFrom(foregroundColor: titleColor),
                            child: const Text('Back to sign in'),
                          ),
                        ],
                      ),
                    )
                  else
                    GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: const [AutofillHints.email],
                            style: const TextStyle(color: _foreground),
                            enabled: !_busy,
                            onChanged: (_) {
                              if (_error != null) setState(() => _error = null);
                            },
                            decoration: const InputDecoration(
                              labelText: 'Email',
                            ),
                          ),
                          SizedBox(height: spacing.md),
                          TextField(
                            controller: _passwordController,
                            focusNode: _passwordFocusNode,
                            obscureText: !_showPassword,
                            keyboardType: TextInputType.visiblePassword,
                            autofillHints: [
                              _isRegister
                                  ? AutofillHints.newPassword
                                  : AutofillHints.password,
                            ],
                            autocorrect: false,
                            enableSuggestions: false,
                            style: const TextStyle(color: _foreground),
                            enabled: !_busy,
                            onChanged: (_) {
                              if (_error != null) setState(() => _error = null);
                            },
                            decoration: InputDecoration(
                              labelText: 'Password',
                              suffixIcon: IconButton(
                                visualDensity: VisualDensity.compact,
                                splashRadius: 20,
                                onPressed: _busy
                                    ? null
                                    : () {
                                        setState(
                                          () => _showPassword = !_showPassword,
                                        );
                                        _passwordFocusNode.requestFocus();
                                      },
                                tooltip: _showPassword
                                    ? 'Hide password'
                                    : 'Show password',
                                icon: Icon(
                                  _showPassword
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                  color: subtitleColor,
                                ),
                              ),
                            ),
                            onSubmitted: (_) => _busy ? null : _submit(),
                          ),
                          if (!_isRegister) ...[
                            SizedBox(height: spacing.xs),
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: _busy ? null : _forgotPassword,
                                style: TextButton.styleFrom(
                                  foregroundColor: _foregroundMuted,
                                  padding: EdgeInsets.zero,
                                  minimumSize: const Size(0, 32),
                                  visualDensity: VisualDensity.compact,
                                ),
                                child: const Text('Forgot password?'),
                              ),
                            ),
                          ],
                          if (_error != null) ...[
                            SizedBox(height: spacing.sm),
                            _ErrorBanner(message: _error!, color: errorColor),
                          ],
                          SizedBox(height: spacing.md),
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
                  if (!_resetSent) ...[
                    SizedBox(height: spacing.md),
                    OutlinedButton.icon(
                      onPressed:
                          _busy ? null : () => _oauth(OAuthProvider.google),
                      icon: const Icon(Icons.g_mobiledata, size: 28),
                      label: const Text('Continue with Google'),
                    ),
                    SizedBox(height: spacing.sm),
                    OutlinedButton.icon(
                      onPressed:
                          _busy ? null : () => _oauth(OAuthProvider.apple),
                      icon: const Icon(Icons.apple),
                      label: const Text('Continue with Apple'),
                    ),
                    SizedBox(height: spacing.lg),
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
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Inline error surface for the auth form, tinted with the theme's error
/// token instead of a hardcoded color, so light/dark appearance stays correct.
class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, required this.color});

  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline, size: 18, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: color, fontSize: 13, height: 1.3),
            ),
          ),
        ],
      ),
    );
  }
}
