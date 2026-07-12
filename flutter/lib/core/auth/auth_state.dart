import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../providers/core_providers.dart';

/// Auth gate lifecycle for shell routes (avoids blank [SizedBox.shrink] while
/// [authSessionProvider] is still resolving after reinstall / OAuth).
enum AuthGateStatus {
  loading,
  signedOut,
  signedIn,
  sessionError,
}

/// Active session for data providers and redirects.
///
/// [authSessionProvider] can be [AsyncLoading] briefly after
/// [authRepositoryProvider] finishes while the stream has not emitted yet.
/// In that window [valueOrNull] is null even when [AuthRepository.currentSession]
/// is already restored (TestFlight blank Today after reinstall).
Session? readActiveSession(Ref ref) {
  ref.watch(authSessionProvider);
  final streamSession = ref.watch(authSessionProvider).valueOrNull;
  if (streamSession != null) return streamSession;
  final auth = ref.watch(authRepositoryProvider).valueOrNull;
  return auth?.currentSession;
}

/// Derived auth gate state for [AuthGate] and redirect helpers.
///
/// After email/password sign-in, [AuthRepository.currentSession] is set
/// immediately while [authSessionProvider] can still be [AsyncData] null for
/// a frame (stream lag). Treat the repo session as authoritative so [AuthGate]
/// does not flash [AuthGateStatus.signedOut] / blank on `/today`.
final authGateStatusProvider = Provider<AuthGateStatus>((ref) {
  final repoAsync = ref.watch(authRepositoryProvider);
  if (repoAsync.isLoading) return AuthGateStatus.loading;
  if (repoAsync.hasError) return AuthGateStatus.sessionError;

  final restoredSession = repoAsync.valueOrNull?.currentSession;
  final sessionAsync = ref.watch(authSessionProvider);

  return sessionAsync.when(
    loading: () {
      if (restoredSession != null) return AuthGateStatus.signedIn;
      return AuthGateStatus.loading;
    },
    error: (_, __) => AuthGateStatus.sessionError,
    data: (session) {
      final active = session ?? restoredSession;
      return active == null
          ? AuthGateStatus.signedOut
          : AuthGateStatus.signedIn;
    },
  );
});

/// True when bootstrap auth is ready (repo initialized + session resolved).
bool isAuthBootstrapReady(Ref ref) {
  final repo = ref.read(authRepositoryProvider);
  if (repo.isLoading) return false;
  final session = ref.read(authSessionProvider);
  if (!session.isLoading) return true;
  return repo.valueOrNull?.currentSession != null;
}

/// Session snapshot for redirects; null when signed out or still bootstrapping.
Session? readAuthenticatedSession(Ref ref) {
  if (!isAuthBootstrapReady(ref)) return null;
  return readActiveSession(ref);
}
