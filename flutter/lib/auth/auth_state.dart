import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/auth/auth_state.dart' as core_auth;
import '../core/providers/core_providers.dart';
import '../features/journal/journal_repository.dart';
import '../features/meds/meds_repository.dart';
import '../features/today/today_repository.dart';
import '../features/vitals/vitals_repository.dart';

/// Auth session wired to Supabase via [authSessionProvider].
class AppAuthState {
  const AppAuthState({this.isAuthenticated = false, this.userId});

  final bool isAuthenticated;
  final String? userId;
}

/// Clears session-scoped data providers so they reload for the active user.
void invalidateSessionDataProviders(Ref ref) {
  ref.invalidate(todayDataProvider);
  ref.invalidate(scoreSnapshotProvider);
  ref.invalidate(medsDataProvider);
  ref.invalidate(journalDataProvider);
  ref.invalidate(vitalsSnapshotProvider);
  ref.invalidate(cachedBiometricsProvider);
  ref.invalidate(cachedMedicationsProvider);
  ref.invalidate(cachedDosesProvider);
  ref.invalidate(cachedJournalProvider);
}

/// Re-fetches app data when the signed-in user id changes (login/logout).
final sessionAuthRefreshProvider = Provider<void>((ref) {
  ref.listen<AsyncValue<Session?>>(authSessionProvider, (previous, next) {
    final previousUserId = previous?.valueOrNull?.user.id;
    final nextUserId = next.valueOrNull?.user.id;
    if (previousUserId != nextUserId) {
      invalidateSessionDataProviders(ref);
    }
  });
});

/// Callable from widgets after sign-in to force a data reload.
final invalidateSessionDataProvider = Provider<void Function()>((ref) {
  return () => invalidateSessionDataProviders(ref);
});

/// Signs out: clears Drift cache for the active user, invalidates data
/// providers, then ends the Supabase session.
final signOutSessionProvider = Provider<Future<void> Function()>((ref) {
  return () async {
    final auth = await ref.read(authRepositoryProvider.future);
    final userId = auth.currentUser?.id ?? auth.currentSession?.user.id;
    if (userId != null) {
      final sync = ref.read(syncServiceProvider);
      await sync.clearUserCache(userId);
    }
    invalidateSessionDataProviders(ref);
    await auth.signOut();
  };
});

final authProvider = Provider<AppAuthState>((ref) {
  ref.watch(sessionAuthRefreshProvider);
  final session = core_auth.readActiveSession(ref);
  return AppAuthState(
    isAuthenticated: session != null,
    userId: session?.user.id,
  );
});

final isAuthenticatedProvider = Provider<bool>(
  (ref) => ref.watch(authProvider).isAuthenticated,
);
