import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_state.dart';
import 'routes.dart';

/// Redirects unauthenticated users to sign-in; keeps signed-in users off auth.
String? authRedirect(Ref ref, GoRouterState state) {
  final isAuthenticated = ref.read(authProvider).isAuthenticated;
  final path = state.uri.path;
  final isSignIn = path == AppRoutes.signIn;
  final isProtected = AppRoutes.protectedPaths.any(
    (route) => path == route || path.startsWith('$route/'),
  );

  if (!isAuthenticated && isProtected) {
    final from = Uri.encodeComponent(state.uri.toString());
    return '${AppRoutes.signIn}?from=$from';
  }

  if (isAuthenticated && isSignIn) {
    final from = state.uri.queryParameters['from'];
    if (from != null && from.isNotEmpty) {
      return Uri.decodeComponent(from);
    }
    return AppRoutes.today;
  }

  return null;
}

/// Widget gate used inside [ShellRoute] for defense in depth.
class AuthGate extends ConsumerWidget {
  const AuthGate({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAuthenticated = ref.watch(isAuthenticatedProvider);
    if (!isAuthenticated) {
      return const SizedBox.shrink();
    }
    return child;
  }
}
