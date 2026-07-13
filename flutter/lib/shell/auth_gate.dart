import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/auth/auth_state.dart' as core_auth;
import '../core/auth/onboarding_gate.dart';
import '../core/providers/core_providers.dart';
import '../features/health/native_health_startup.dart';
import 'routes.dart';

/// Redirects unauthenticated users to sign-in; keeps signed-in users off auth.
Future<String?> authRedirect(Ref ref, GoRouterState state) async {
  if (!core_auth.isAuthBootstrapReady(ref)) {
    return null;
  }

  final session = core_auth.readAuthenticatedSession(ref);
  final isAuthenticated = session != null;
  final userId = session?.user.id;
  final path = state.uri.path;
  final isSignIn = path == AppRoutes.signIn;
  final isResetPassword = path == AppRoutes.resetPassword;
  final isWelcome = path == AppRoutes.welcome;
  final isWearableOAuthCallback = path == AppRoutes.oauthOuraCallback ||
      path == AppRoutes.oauthWhoopCallback;
  final isProtected = AppRoutes.protectedPaths.any(
    (route) => path == route || path.startsWith('$route/'),
  );

  if (ref.read(core_auth.authGateStatusProvider) ==
      core_auth.AuthGateStatus.sessionError) {
    if (isSignIn || isResetPassword) return null;
    return '${AppRoutes.signIn}?error=session';
  }

  if (isResetPassword) {
    return null;
  }

  if (!isAuthenticated && (isProtected || isWearableOAuthCallback)) {
    final from = Uri.encodeComponent(state.uri.toString());
    return '${AppRoutes.signIn}?from=$from';
  }

  if (!isAuthenticated || userId == null) {
    return null;
  }

  if (isWearableOAuthCallback) {
    return null;
  }

  final isOnboarded = await resolveOnboarded(
    client: ref.read(supabaseClientProvider),
    userId: userId,
  );

  if (isAuthenticated && isSignIn) {
    if (!isOnboarded) {
      return AppRoutes.welcome;
    }
    final decoded = _decodedFrom(state);
    if (decoded != null) {
      return decoded == AppRoutes.welcome ? AppRoutes.today : decoded;
    }
    return AppRoutes.today;
  }

  if (isWelcome) {
    return isOnboarded ? AppRoutes.today : null;
  }

  if (!isOnboarded) {
    return AppRoutes.welcome;
  }

  return null;
}

String? _decodedFrom(GoRouterState state) {
  final from = state.uri.queryParameters['from'];
  if (from == null || from.isEmpty) return null;
  final decoded = Uri.decodeComponent(from);
  return decoded.startsWith('/') ? decoded : null;
}

/// Widget gate used inside [ShellRoute] for defense in depth.
///
/// TF27: uses [core_auth.authGateStatusProvider] which treats
/// [AuthRepository.currentSession] as authoritative when the session stream
/// lags after password sign-in (do not regress to blank [SizedBox.shrink]).
class AuthGate extends ConsumerWidget {
  const AuthGate({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(core_auth.authGateStatusProvider);
    switch (status) {
      case core_auth.AuthGateStatus.loading:
        return const Center(child: CircularProgressIndicator());
      case core_auth.AuthGateStatus.signedOut:
      case core_auth.AuthGateStatus.sessionError:
        return const SizedBox.shrink();
      case core_auth.AuthGateStatus.signedIn:
        return NativeHealthStartupListener(child: child);
    }
  }
}
