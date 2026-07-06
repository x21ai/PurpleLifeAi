import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth/auth_state.dart';
import '../../core/providers/core_providers.dart';
import '../../design/glass_card.dart';
import '../../design/purple_theme.dart';
import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart' hide GlassCard;
import 'sign_in_screen.dart';

/// Choose a new password after opening a recovery deep link or web URL.
class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  static const _foreground = purpleForegroundDark;
  static const _foregroundMuted = Color(0x8CFFFFFF);

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
            'That reset link expired or was already used. Request a new one from sign in.';
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
    final themeExt = Theme.of(context).extension<PurpleThemeExtension>();
    final titleColor = themeExt != null
        ? parseTokenColor(themeExt.colors.textPrimary)
        : _foreground;
    final subtitleColor = themeExt != null
        ? parseTokenColor(themeExt.colors.textTertiary)
        : _foregroundMuted;
    final errorColor = Theme.of(context).colorScheme.error;

    return Scaffold(
      backgroundColor: purpleCanvasDark,
      body: CanvasBackground(
        auth: true,
        child: SafeArea(
          child: ContentColumn(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Reset password',
                  style: PurpleType.serifStyle(
                    fontSize: 36,
                    height: 1.05,
                    color: titleColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _done
                      ? 'Password updated. Taking you to Today…'
                      : _linkExpired
                          ? 'That reset link expired or was already used.'
                          : 'Choose a new password for your account.',
                  style: PurpleType.bodySerif(color: subtitleColor),
                ),
                const SizedBox(height: 24),
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (!_ready && !_done && !_linkExpired)
                        Text(
                          'Open the reset link from your email to continue.',
                          style: TextStyle(color: subtitleColor, fontSize: 14),
                        ),
                      if (_linkExpired && !_done) ...[
                        Text(
                          _error ??
                              'Request a new reset link from sign in, then open it from your email.',
                          style: TextStyle(color: subtitleColor, fontSize: 14),
                        ),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: _busy
                              ? null
                              : () => context.go(AppRoutes.signIn),
                          child: const Text('Back to sign in'),
                        ),
                      ],
                      if (_ready && !_done) ...[
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          autocorrect: false,
                          decoration: const InputDecoration(
                            labelText: 'New password',
                          ),
                          enabled: !_busy,
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _confirmController,
                          obscureText: true,
                          autocorrect: false,
                          decoration: const InputDecoration(
                            labelText: 'Confirm password',
                          ),
                          enabled: !_busy,
                          onSubmitted: (_) => _busy ? null : _submit(),
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: _busy ? null : _submit,
                          child: Text(_busy ? 'Updating…' : 'Update password'),
                        ),
                      ],
                      if (_error != null && !_linkExpired) ...[
                        const SizedBox(height: 12),
                        Text(
                          _error!,
                          style: TextStyle(color: errorColor, fontSize: 14),
                        ),
                      ],
                      if (!_linkExpired) ...[
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: _busy ? null : () => context.go(AppRoutes.signIn),
                          child: const Text('Back to sign in'),
                        ),
                      ],
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
