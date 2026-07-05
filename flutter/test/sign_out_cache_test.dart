import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/auth/auth_state.dart';
import 'package:purple_app/core/auth/auth_repository.dart';
import 'package:purple_app/core/offline/sync_service.dart';
import 'package:purple_app/core/providers/core_providers.dart';
import 'package:purple_app/features/journal/journal_repository.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/today/today_repository.dart';
import 'package:purple_app/features/today/models/today_data.dart';
import 'package:purple_app/features/today/models/score_snapshot.dart';
import 'package:purple_app/features/vitals/vitals_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  group('signOutSessionProvider', () {
    test('clears user cache and invalidates session data providers', () async {
      final session = _fakeSession();
      final authRepo = _TrackingAuthRepository(session: session);
      final sync = _TrackingSyncService();
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) async => authRepo),
          syncServiceProvider.overrideWithValue(sync),
        ],
      );
      addTearDown(container.dispose);

      container.read(todayDataProvider);
      container.read(medsDataProvider);
      container.read(journalDataProvider);
      container.read(vitalsSnapshotProvider);

      await container.read(signOutSessionProvider)();

      expect(sync.clearedUserIds, [session.user.id]);
      expect(authRepo.signOutCalls, 1);
      expect(container.read(todayDataProvider), isA<AsyncLoading<TodayData>>());
      expect(container.read(medsDataProvider), isA<AsyncLoading<MedsData>>());
      expect(container.read(journalDataProvider), isA<AsyncLoading<JournalData>>());
      expect(container.read(vitalsSnapshotProvider), isA<AsyncLoading<ScoreSnapshot>>());
    });

    test('skips cache clear when no active user', () async {
      final authRepo = _TrackingAuthRepository(session: null);
      final sync = _TrackingSyncService();
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) async => authRepo),
          syncServiceProvider.overrideWithValue(sync),
        ],
      );
      addTearDown(container.dispose);

      await container.read(signOutSessionProvider)();

      expect(sync.clearedUserIds, isEmpty);
      expect(authRepo.signOutCalls, 1);
    });
  });
}

Session _fakeSession() {
  return Session(
    accessToken: 'test-token',
    tokenType: 'bearer',
    user: const User(
      id: 'bb160030-2ed6-45d7-8a5a-7f6f7879e9bb',
      appMetadata: {},
      userMetadata: {},
      aud: 'authenticated',
      createdAt: '2026-01-01T00:00:00Z',
      email: 'test@purplelife.org',
    ),
  );
}

class _TrackingAuthRepository implements AuthRepository {
  _TrackingAuthRepository({required this.session});

  Session? session;
  int signOutCalls = 0;

  @override
  bool get isAuthenticated => session != null;

  @override
  Session? get currentSession => session;

  @override
  User? get currentUser => session?.user;

  @override
  Future<void> signOut() async {
    signOutCalls++;
    session = null;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _TrackingSyncService implements SyncService {
  final clearedUserIds = <String>[];

  @override
  Future<void> clearUserCache(String userId) async {
    clearedUserIds.add(userId);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
