import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth/auth_state.dart';
import '../../core/auth/auth_repository.dart';
import '../../core/providers/core_providers.dart';
import 'ploy_access_chrome.dart';

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
            _error = 'Check your inbox to confirm your email, then sign in.';
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
      setState(
        () => _error =
            'Enter your email above first, then tap Password recovery again.',
      );
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

  void _clearErrorOnEdit() {
    setState(() {
      if (_error != null) _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final authReady = ref.watch(authRepositoryProvider);
    final canSubmit = !_busy &&
        _emailController.text.trim().isNotEmpty &&
        _passwordController.text.isNotEmpty;

    return PloyAccessPage(
      child: authReady.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: PloyAccessColors.accent),
        ),
        error: (error, _) => Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'Auth init failed: $error',
            style: const TextStyle(color: PloyAccessColors.ink),
          ),
        ),
        data: (_) => SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              PloyAccessHeader(
                eyebrow: 'Private account',
                title: _isRegister
                    ? 'Create your calm space.'
                    : 'Sign in to PurpleLife.',
                subtitle: _isRegister
                    ? 'Choose an email and password for your private PurpleLife account.'
                    : 'Use your PurpleLife account password to access your private health data.',
              ),
              const SizedBox(height: 32),
              PloyAccessCard(
                child: _resetSent ? _resetSentCard() : _formCard(canSubmit),
              ),
              const SizedBox(height: 20),
              const PloyPrivacyNote(
                text:
                    'Your secure session stays on this device and authorizes requests for your private account data.',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _resetSentCard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Check your inbox',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: PloyAccessColors.ink,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'We sent a password reset link to '
          '${_emailController.text.trim()}. Use only the latest email; '
          'older links stop working when you request another. '
          'The link stays valid for $recoveryLinkTtlLabel. '
          'If nothing arrives, check spam and any work-email quarantine '
          '(sender notify.purplelife.org), or sign in with a password '
          'set by support and change it under Account.',
          style: const TextStyle(
            fontSize: 15,
            height: 1.45,
            color: PloyAccessColors.muted,
          ),
        ),
        const SizedBox(height: 8),
        PloyLinkButton(
          label: 'Back to sign in',
          onPressed: () => setState(() {
            _resetSent = false;
            _error = null;
          }),
        ),
      ],
    );
  }

  Widget _formCard(bool canSubmit) {
    const fieldStyle = TextStyle(
      color: PloyAccessColors.ink,
      fontSize: 14,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const PloyFieldLabel('Email'),
        const SizedBox(height: 8),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
          style: fieldStyle,
          enabled: !_busy,
          onChanged: (_) => _clearErrorOnEdit(),
          decoration: ployFieldDecoration(),
        ),
        const SizedBox(height: 16),
        const PloyFieldLabel('Password'),
        const SizedBox(height: 8),
        TextField(
          controller: _passwordController,
          focusNode: _passwordFocusNode,
          obscureText: !_showPassword,
          keyboardType: TextInputType.visiblePassword,
          autofillHints: [
            _isRegister ? AutofillHints.newPassword : AutofillHints.password,
          ],
          autocorrect: false,
          enableSuggestions: false,
          style: fieldStyle,
          enabled: !_busy,
          onChanged: (_) => _clearErrorOnEdit(),
          decoration: ployFieldDecoration(
            prefix: const Icon(
              Icons.key_outlined,
              size: 17,
              color: PloyAccessColors.muted,
            ),
            suffix: IconButton(
              visualDensity: VisualDensity.compact,
              onPressed: _busy
                  ? null
                  : () {
                      setState(() => _showPassword = !_showPassword);
                      _passwordFocusNode.requestFocus();
                    },
              tooltip: _showPassword ? 'Hide password' : 'Show password',
              icon: Icon(
                _showPassword ? Icons.visibility_off : Icons.visibility,
                color: PloyAccessColors.muted,
              ),
            ),
          ),
          onSubmitted: (_) {
            if (canSubmit) _submit();
          },
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(
            _error!,
            style: const TextStyle(
              color: PloyAccessColors.coral,
              fontSize: 12,
              height: 1.4,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
        const SizedBox(height: 20),
        // FilledButton keeps reliable taps (TF26: InkWell over a
        // decorated box missed presses on some devices).
        PloyAccentButton(
          label: _busy
              ? 'Please wait…'
              : _isRegister
                  ? 'Create account'
                  : 'Sign in',
          onPressed: canSubmit ? _submit : null,
        ),
        if (!_isRegister)
          PloyLinkButton(
            label: 'Password recovery',
            onPressed: _busy ? null : _forgotPassword,
          ),
        PloyLinkButton(
          label:
              _isRegister ? 'I already have an account' : 'Create an account',
          accent: false,
          onPressed: _busy
              ? null
              : () => setState(() {
                    _isRegister = !_isRegister;
                    _error = null;
                  }),
        ),
        PloyLinkButton(
          label: 'Continue with Google',
          onPressed: _busy ? null : () => _oauth(OAuthProvider.google),
        ),
        PloyLinkButton(
          label: 'Continue with Apple',
          onPressed: _busy ? null : () => _oauth(OAuthProvider.apple),
        ),
      ],
    );
  }
}
