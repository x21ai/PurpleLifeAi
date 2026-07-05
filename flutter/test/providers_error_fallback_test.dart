import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/auth/auth_repository.dart';
import 'package:purple_app/core/providers/core_providers.dart';
import 'package:purple_app/features/journal/journal_repository.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/today/models/score_snapshot.dart';
import 'package:purple_app/features/today/models/today_data.dart';
import 'package:purple_app/features/today/today_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<AuthRepository> _readyAuth() async => _FakeAuthRepository();

void main() {
  group('todayDataProvider', () {
    test('returns empty data when no session exists', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => _readyAuth()),
          authSessionProvider.overrideWith(
            (ref) => Stream<Session?>.value(null),
          ),
        ],
      );
      addTearDown(container.dispose);
      final subscription = container.listen(
        todayDataProvider,
        (_, __) {},
        fireImmediately: true,
      );
      addTearDown(subscription.close);

      final data = await container.read(todayDataProvider.future);
      final asyncValue = subscription.read();

      expect(asyncValue.hasError, isFalse);
      expect(asyncValue.hasValue, isTrue);
      expect(data, same(TodayData.empty));
      expect(data.scores, same(ScoreSnapshot.empty));
    });

    test('propagates repository errors when session exists', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => _readyAuth()),
          authSessionProvider.overrideWith(
            (ref) => Stream<Session?>.value(_fakeSession()),
          ),
          todayRepositoryProvider.overrideWithValue(_ThrowingTodayRepository()),
        ],
      );
      addTearDown(container.dispose);
      container.listen(authSessionProvider, (_, __) {});
      await container.read(authRepositoryProvider.future);
      await expectLater(
        container.read(todayDataProvider.future),
        throwsA(isA<StateError>()),
      );
    });
  });

  group('scoreSnapshotProvider', () {
    test('returns empty snapshot when no session exists', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => _readyAuth()),
          authSessionProvider.overrideWith(
            (ref) => Stream<Session?>.value(null),
          ),
        ],
      );
      addTearDown(container.dispose);
      final subscription = container.listen(
        scoreSnapshotProvider,
        (_, __) {},
        fireImmediately: true,
      );
      addTearDown(subscription.close);

      final snapshot = await container.read(scoreSnapshotProvider.future);
      final asyncValue = subscription.read();

      expect(asyncValue.hasError, isFalse);
      expect(asyncValue.hasValue, isTrue);
      expect(snapshot, same(ScoreSnapshot.empty));
      expect(snapshot.hasData, isFalse);
    });

    test('propagates repository errors when session exists', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => _readyAuth()),
          authSessionProvider.overrideWith(
            (ref) => Stream<Session?>.value(_fakeSession()),
          ),
          todayRepositoryProvider.overrideWithValue(_ThrowingTodayRepository()),
        ],
      );
      addTearDown(container.dispose);
      container.listen(authSessionProvider, (_, __) {});
      await container.read(authRepositoryProvider.future);
      await expectLater(
        container.read(scoreSnapshotProvider.future),
        throwsA(isA<StateError>()),
      );
    });
  });

  group('medsDataProvider', () {
    test('returns empty data when no session exists', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => _readyAuth()),
          authSessionProvider.overrideWith(
            (ref) => Stream<Session?>.value(null),
          ),
        ],
      );
      addTearDown(container.dispose);
      final subscription = container.listen(
        medsDataProvider,
        (_, __) {},
        fireImmediately: true,
      );
      addTearDown(subscription.close);

      final data = await container.read(medsDataProvider.future);
      final asyncValue = subscription.read();

      expect(asyncValue.hasError, isFalse);
      expect(asyncValue.hasValue, isTrue);
      expect(data, same(MedsData.empty));
      expect(data.medications, isEmpty);
      expect(data.todayDoses, isEmpty);
    });

    test('propagates repository errors when session exists', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => _readyAuth()),
          authSessionProvider.overrideWith(
            (ref) => Stream<Session?>.value(_fakeSession()),
          ),
          medsRepositoryProvider.overrideWithValue(_ThrowingMedsRepository()),
        ],
      );
      addTearDown(container.dispose);
      container.listen(authSessionProvider, (_, __) {});
      await container.read(authRepositoryProvider.future);
      await expectLater(
        container.read(medsDataProvider.future),
        throwsA(isA<StateError>()),
      );
    });
  });

  group('journalDataProvider', () {
    test('returns empty data when no session exists', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => _readyAuth()),
          authSessionProvider.overrideWith(
            (ref) => Stream<Session?>.value(null),
          ),
        ],
      );
      addTearDown(container.dispose);
      final subscription = container.listen(
        journalDataProvider,
        (_, __) {},
        fireImmediately: true,
      );
      addTearDown(subscription.close);

      final data = await container.read(journalDataProvider.future);
      final asyncValue = subscription.read();

      expect(asyncValue.hasError, isFalse);
      expect(asyncValue.hasValue, isTrue);
      expect(data, same(JournalData.empty));
      expect(data.entries, isEmpty);
      expect(data.pendingCount, 0);
    });

    test('propagates repository errors when session exists', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => _readyAuth()),
          authSessionProvider.overrideWith(
            (ref) => Stream<Session?>.value(_fakeSession()),
          ),
          journalRepositoryProvider.overrideWithValue(
            _ThrowingJournalRepository(),
          ),
        ],
      );
      addTearDown(container.dispose);
      container.listen(authSessionProvider, (_, __) {});
      await container.read(authRepositoryProvider.future);
      await expectLater(
        container.read(journalDataProvider.future),
        throwsA(isA<StateError>()),
      );
    });
  });
}

class _FakeAuthRepository implements AuthRepository {
  @override
  bool get isAuthenticated => false;

  @override
  Session? get currentSession => null;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Session _fakeSession() {
  return Session(
    accessToken: 'test-token',
    tokenType: 'bearer',
    user: const User(
      id: '00000000-0000-0000-0000-000000000001',
      appMetadata: {},
      userMetadata: {},
      aud: 'authenticated',
      createdAt: '2026-01-01T00:00:00Z',
      email: 'test@purplelife.org',
    ),
  );
}

class _ThrowingTodayRepository implements TodayRepository {
  @override
  Future<TodayData> loadToday({String? dateYmd}) async {
    throw StateError('sync failed');
  }

  @override
  Future<ScoreSnapshot> loadScoreSnapshot({String? dateYmd}) async {
    throw StateError('sync failed');
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _ThrowingMedsRepository implements MedsRepository {
  @override
  Future<MedsData> loadMeds({String? viewDateYmd}) async {
    throw StateError('sync failed');
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _ThrowingJournalRepository implements JournalRepository {
  @override
  Future<JournalData> loadEntries() async {
    throw StateError('sync failed');
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
