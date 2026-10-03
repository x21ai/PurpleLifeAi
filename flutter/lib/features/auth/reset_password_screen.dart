import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth/auth_state.dart';
import '../../core/auth/auth_repository.dart';
import '../../core/providers/core_providers.dart';
import '../../shell/routes.dart';
import 'ploy_access_chrome.dart';
import 'sign_in_screen.dart';

/// Choose a new password after opening a recovery deep link or web URL.
class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  StreamSubscription<AuthState>? _authSub;
  bool _ready = false;
  bool _busy = false;
  bool _done = false;
  bool _linkExpired = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final client = ref.read(supabaseClientProvider);
    _authSub = client.auth.onAuthStateChange.listen((data) {
      final event = data.event;
      if (event == AuthChangeEvent.passwordRecovery ||
          event == AuthChangeEvent.signedIn) {
        if (mounted) setState(() => _ready = true);
      }
    });
    final session = client.auth.currentSession;
    if (session != null && mounted) setState(() => _ready = true);
    if (kIsWeb) {
      unawaited(_bootstrapWebRecovery());
    }
  }

  Future<void> _bootstrapWebRecovery() async {
    final auth = await ref.read(authRepositoryProvider.future);
    final uri = Uri.base;
    final result = await auth.bootstrapRecoveryFromUri(uri);
    if (!mounted) return;
    if (result.ok) {
      setState(() {
        _ready = true;
        _linkExpired = false;
      });
      return;
    }
    if (result.expired) {
      setState(() {
        _linkExpired = true;
        _error = result.message ??
            'That reset link expired or was already used. Reset links expire after $recoveryLinkTtlLabel.';
      });
      return;
    }
    if (result.message != null) {
      setState(() => _error = result.message);
    }
  }

  @override
  void dispose() {
    unawaited(_authSub?.cancel());
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final password = _passwordController.text;
    final confirm = _confirmController.text;
    if (password.length < 8) {
      setState(() => _error = 'Use at least 8 characters.');
      return;
    }
    if (password != confirm) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final client = ref.read(supabaseClientProvider);
      await client.auth.updateUser(UserAttributes(password: password));
      if (!mounted) return;
      setState(() => _done = true);
      ref.read(invalidateSessionDataProvider)();
      await Future<void>.delayed(const Duration(milliseconds: 900));
      if (!mounted) return;
      context.go(AppRoutes.today);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = friendlyAuthError(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final subtitle = _done
        ? 'Password updated. Taking you to Today…'
        : _linkExpired
            ? 'That reset link expired or was already used.'
            : 'Choose a new password for your account.';
    const fieldStyle = TextStyle(color: PloyAccessColors.ink, fontSize: 14);

    return PloyAccessPage(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 32, 20, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            PloyAccessHeader(
              eyebrow: 'Account security',
              title: 'Choose a new password.',
              subtitle: subtitle,
              shieldMaxWidth: 300,
            ),
            const SizedBox(height: 32),
            PloyAccessCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (!_ready && !_done && !_linkExpired)
                    const Text(
                      'Open the reset link from your email to continue.',
                      style: TextStyle(
                        color: PloyAccessColors.muted,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  if (_linkExpired && !_done) ...[
                    Text(
                      _error ??
                          'Reset links expire after $recoveryLinkTtlLabel and only the latest email works.',
                      style: const TextStyle(
                        color: PloyAccessColors.muted,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    PloyAccentButton(
                      label: 'Sign in with your password',
                      showArrow: false,
                      onPressed:
                          _busy ? null : () => context.go(AppRoutes.signIn),
                    ),
                    PloyLinkButton(
                      label: 'Request a new reset link',
                      onPressed: _busy
                          ? null
                          : () =>
                              context.go('${AppRoutes.signIn}?reset=expired'),
                    ),
                  ],
                  if (_ready && !_done) ...[
                    const PloyFieldLabel('New password'),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      autocorrect: false,
                      enableSuggestions: false,
                      style: fieldStyle,
                      decoration: ployFieldDecoration(),
                      enabled: !_busy,
                    ),
                    const SizedBox(height: 16),
                    const PloyFieldLabel('Confirm password'),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _confirmController,
                      obscureText: true,
                      autocorrect: false,
                      enableSuggestions: false,
                      style: fieldStyle,
                      decoration: ployFieldDecoration(),
                      enabled: !_busy,
                      onSubmitted: (_) => _busy ? null : _submit(),
                    ),
                    const SizedBox(height: 20),
                    PloyAccentButton(
                      label: _busy ? 'Updating…' : 'Update password',
                      showArrow: false,
                      onPressed: _busy ? null : _submit,
                    ),
                  ],
                  if (_error != null && !_linkExpired) ...[
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
                  if (!_linkExpired)
                    PloyLinkButton(
                      label: 'Back to sign in',
                      onPressed:
                          _busy ? null : () => context.go(AppRoutes.signIn),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
