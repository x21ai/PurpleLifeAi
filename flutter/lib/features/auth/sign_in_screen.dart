import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth/auth_state.dart';
import '../../core/auth/auth_repository.dart';
import '../../core/providers/core_providers.dart';
import '../../design/glass_card.dart';
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

/// Shown when routing from `/sign-in?error=session` (expired or invalid restore).
const sessionExpiredSignInMessage =
    'Your session expired or could not be verified. Please sign in again to continue.';

/// Email/password and OAuth sign-in using Supabase auth.
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({this.resetLinkExpired = false, super.key});

  /// Set when routing from `/sign-in?reset=expired` (expired recovery deep link).
  final bool resetLinkExpired;

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordFocusNode = FocusNode();
  bool _isRegister = false;
  bool _showPassword = false;
  bool _busy = false;
  bool _resetSent = false;
  String? _error;
  bool _queryErrorHandled = false;

  @override
  void initState() {
    super.initState();
    if (widget.resetLinkExpired) {
      _error =
          'That reset link expired or was already used. Reset links expire after $recoveryLinkTtlLabel. '
          'Sign in with your password below, or request a new link only if you still need one.';
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_queryErrorHandled || widget.resetLinkExpired || _error != null) {
      return;
    }
    final error = GoRouterState.of(context).uri.queryParameters['error'];
    if (error == 'session') {
      _queryErrorHandled = true;
      setState(() => _error = sessionExpiredSignInMessage);
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
        // Confirmations enabled: no session until the user clicks the email link.
        if (response.session == null) {
          if (!mounted) return;
          setState(() {
            _isRegister = false;
            _error =
                'Check your inbox to confirm your email, then sign in.';
            _busy = false;
          });
          return;
        }
        ref.read(invalidateSessionDataProvider)();
      } else {
        final response =
            await auth.signInWithEmail(email: email, password: password);
        if (response.session == null && auth.currentSession == null) {
          if (!mounted) return;
          setState(() {
            _error =
                'Sign in did not create a session. Check your connection and try again.';
            _busy = false;
          });
          return;
        }
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
    const canvas = Color(0xFF0A0710);
    const purple = Color(0xFFB084D1);
    const purpleDeep = Color(0xFF6E3FA0);
    const muted = Color(0xFF8B8B92);
    const border = Color(0xFF25202F);
    const bg2 = Color(0xFF1F1A2B);
    const text = Color(0xFFFAFAFC);
    final errorColor = Theme.of(context).colorScheme.error;

    InputDecoration fieldDecoration(String hint) => InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: muted, fontSize: 16),
          filled: true,
          fillColor: bg2,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: purple.withValues(alpha: 0.7)),
          ),
        );

    final ButtonStyle ghostStyle = OutlinedButton.styleFrom(
      foregroundColor: purple,
      side: BorderSide(color: purple.withValues(alpha: 0.45)),
      minimumSize: const Size.fromHeight(44),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      backgroundColor: Colors.transparent,
    );

    return Scaffold(
      backgroundColor: canvas,
      body: CanvasBackground(
        auth: true,
        child: SafeArea(
          child: ContentColumn(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            child: authReady.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: purple),
              ),
              error: (error, _) => Text(
                'Auth init failed: $error',
                style: const TextStyle(color: text),
              ),
              data: (_) => SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 24),
                    const Text(
                      'Purple',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w600,
                        color: text,
                        letterSpacing: 0.02 * 32,
                      ),
                    ),
                    const SizedBox(height: 32),
                    if (_resetSent)
                      GlassCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text(
                              'Check your inbox',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: text,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'We sent a password reset link to '
                              '${_emailController.text.trim()}. Use only the latest email; '
                              'older links stop working when you request another. '
                              'The link stays valid for $recoveryLinkTtlLabel.',
                              style: const TextStyle(
                                fontSize: 15,
                                height: 1.45,
                                color: muted,
                              ),
                            ),
                            const SizedBox(height: 16),
                            OutlinedButton(
                              onPressed: () => setState(() {
                                _resetSent = false;
                                _error = null;
                              }),
                              style: ghostStyle,
                              child: const Text('Back to sign in'),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
                        decoration: BoxDecoration(
                          color: const Color(0xBF14101C),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              _isRegister ? 'CREATE ACCOUNT' : 'SIGN IN',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 11,
                                letterSpacing: 0.1 * 11,
                                fontWeight: FontWeight.w600,
                                color: muted,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'A quiet intelligence for your health.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 15,
                                height: 1.45,
                                color: muted,
                              ),
                            ),
                            const SizedBox(height: 20),
                            OutlinedButton(
                              onPressed: _busy
                                  ? null
                                  : () => _oauth(OAuthProvider.google),
                              style: ghostStyle,
                              child: const Text('Continue with Google'),
                            ),
                            const SizedBox(height: 8),
                            OutlinedButton(
                              onPressed: _busy
                                  ? null
                                  : () => _oauth(OAuthProvider.apple),
                              style: ghostStyle,
                              child: const Text('Continue with Apple'),
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              autofillHints: const [AutofillHints.email],
                              style: const TextStyle(color: text, fontSize: 16),
                              enabled: !_busy,
                              onChanged: (_) {
                                if (_error != null) {
                                  setState(() => _error = null);
                                }
                              },
                              decoration: fieldDecoration('Email'),
                            ),
                            const SizedBox(height: 10),
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
                              style: const TextStyle(color: text, fontSize: 16),
                              enabled: !_busy,
                              onChanged: (_) {
                                if (_error != null) {
                                  setState(() => _error = null);
                                }
                              },
                              decoration: fieldDecoration('Password').copyWith(
                                suffixIcon: IconButton(
                                  visualDensity: VisualDensity.compact,
                                  splashRadius: 20,
                                  onPressed: _busy
                                      ? null
                                      : () {
                                          setState(
                                            () =>
                                                _showPassword = !_showPassword,
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
                                    color: muted,
                                  ),
                                ),
                              ),
                              onSubmitted: (_) => _busy ? null : _submit(),
                            ),
                            if (!_isRegister) ...[
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: _busy ? null : _forgotPassword,
                                  style: TextButton.styleFrom(
                                    foregroundColor: muted,
                                    padding: EdgeInsets.zero,
                                    minimumSize: const Size(0, 36),
                                    visualDensity: VisualDensity.compact,
                                  ),
                                  child: const Text(
                                    'Forgot password?',
                                    style: TextStyle(fontSize: 13),
                                  ),
                                ),
                              ),
                            ],
                            if (_error != null) ...[
                              const SizedBox(height: 8),
                              _ErrorBanner(
                                message: _error!,
                                color: errorColor,
                              ),
                            ],
                            const SizedBox(height: 8),
                            // Gradient CTA keeps newdesign look; FilledButton
                            // restores pre-TF26 semantics and reliable taps
                            // (InkWell-over-DecoratedBox missed presses on some devices).
                            DecoratedBox(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(14),
                                gradient: const LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [purpleDeep, purple],
                                ),
                              ),
                              child: FilledButton(
                                onPressed: _busy ? null : _submit,
                                style: FilledButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  disabledBackgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  foregroundColor: Colors.white,
                                  disabledForegroundColor:
                                      Colors.white.withValues(alpha: 0.7),
                                  minimumSize: const Size.fromHeight(48),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                ),
                                child: Text(
                                  _busy
                                      ? 'Please wait…'
                                      : _isRegister
                                          ? 'Create account'
                                          : 'Sign in',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            OutlinedButton(
                              onPressed: _busy
                                  ? null
                                  : () => setState(() {
                                        _isRegister = !_isRegister;
                                        _error = null;
                                      }),
                              style: ghostStyle,
                              child: Text(
                                _isRegister
                                    ? 'Already have an account? Sign in'
                                    : 'Create your account',
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
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
