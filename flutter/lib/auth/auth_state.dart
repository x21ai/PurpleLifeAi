import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/providers/core_providers.dart';

/// Auth session wired to Supabase via [authSessionProvider].
class AppAuthState {
  const AppAuthState({this.isAuthenticated = false, this.userId});

  final bool isAuthenticated;
  final String? userId;
}

final authProvider = Provider<AppAuthState>((ref) {
  final session = ref.watch(authSessionProvider).valueOrNull;
  return AppAuthState(
    isAuthenticated: session != null,
    userId: session?.user.id,
  );
});

final isAuthenticatedProvider = Provider<bool>(
  (ref) => ref.watch(authProvider).isAuthenticated,
);
