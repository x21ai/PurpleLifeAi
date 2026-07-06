import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_state.dart';
import '../core/providers/core_providers.dart';
import '../features/health/native_health_startup.dart';
import 'routes.dart';

/// Redirects unauthenticated users to sign-in; keeps signed-in users off auth.
Future<String?> authRedirect(Ref ref, GoRouterState state) async {
  final authState = ref.read(authProvider);
  final isAuthenticated = authState.isAuthenticated;
  final userId = authState.userId;
  final path = state.uri.path;
  final isSignIn = path == AppRoutes.signIn;
  final isResetPassword = path == AppRoutes.resetPassword;
  final isWelcome = path == AppRoutes.welcome;
  final isWearableOAuthCallback = path == AppRoutes.oauthOuraCallback ||
      path == AppRoutes.oauthWhoopCallback;
  final isProtected = AppRoutes.protectedPaths.any(
    (route) => path == route || path.startsWith('$route/'),
  );

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

  final isOnline = ref.read(connectivityServiceProvider).isOnline;
  final isOnboarded = await _isOnboarded(ref, userId, isOnline: isOnline);

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

Future<bool> _isOnboarded(
  Ref ref,
  String userId, {
  required bool isOnline,
}) async {
  try {
    final client = ref.read(supabaseClientProvider);
    final profile = await client
        .from('profiles')
        .select('id, onboarded_at, first_name')
        .eq('id', userId)
        .maybeSingle();
    return _profileIsOnboarded(profile);
  } catch (error, stack) {
    debugPrint('[authRedirect] onboarding lookup failed: $error\n$stack');
    // Do not trap returning users on welcome when profile read fails online.
    if (isOnline) return true;
    return false;
  }
}

bool _profileIsOnboarded(Map<String, dynamic>? profile) {
  if (profile == null) return false;
  if (profile['onboarded_at'] != null) return true;
  final firstName = profile['first_name'];
  if (firstName is String && firstName.trim().isNotEmpty) return true;
  return false;
}

String? _decodedFrom(GoRouterState state) {
  final from = state.uri.queryParameters['from'];
  if (from == null || from.isEmpty) return null;
  final decoded = Uri.decodeComponent(from);
  return decoded.startsWith('/') ? decoded : null;
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
    return NativeHealthStartupListener(child: child);
  }
}
