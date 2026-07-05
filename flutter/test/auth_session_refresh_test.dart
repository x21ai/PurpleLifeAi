// Auth session refresh tests for signed-in data providers.
//
// Production verification user (pmt@eigital.com):
//   uuid bb160030-2ed6-45d7-8a5a-7f6f7879e9bb
//   medications=2, medication_doses=33, journal_entries=2, biometrics=3920
//   (queried 2026-07-04 via Supabase Management API on xxnzmfzsjplrutrgbzxy)
//
// ## authSessionProvider.future antipattern
//
// todayDataProvider, scoreSnapshotProvider, and medsDataProvider currently use:
//
//   final session = await ref.watch(authSessionProvider.future);
//
// StreamProvider.future resolves when the stream emits its **first** value. If that
// value is null (logged-out bootstrap), the Future completes with null and Riverpod
// may not re-run dependents when the stream later emits a Session after login.
// Screens then stay on TodayData.empty / MedsData.empty until manual invalidation
// (see today_screen.dart pull-to-refresh invalidates).
//
// Prefer watching the stream AsyncValue directly, e.g.:
//
//   final session = ref.watch(authSessionProvider).valueOrNull;
//
// so providers rebuild on every auth transition (null -> Session, Session -> null).

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/auth/auth_repository.dart';
import 'package:purple_app/core/providers/core_providers.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/meds/models/medication.dart';
import 'package:purple_app/features/today/models/score_snapshot.dart';
import 'package:purple_app/features/today/models/today_data.dart';
import 'package:purple_app/features/today/today_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  group('auth session null -> Session refresh', () {
    test('todayDataProvider re-executes and loads data after login', () async {
      final sessionStream = StreamController<Session?>();
      final todayRepo = _CountingTodayRepository();
      final container = ProviderContainer(
        overrides: [
          authSessionProvider.overrideWith((ref) => sessionStream.stream),
          authRepositoryProvider.overrideWith(
            (ref) async => _FakeAuthRepository(),
          ),
          todayRepositoryProvider.overrideWithValue(todayRepo),
        ],
      );
      addTearDown(() {
        unawaited(sessionStream.close());
        container.dispose();
      });

      final todayStates = <AsyncValue<TodayData>>[];
      final todaySub = container.listen(
        todayDataProvider,
        (_, next) => todayStates.add(next),
        fireImmediately: true,
      );
      addTearDown(todaySub.close);

      sessionStream.add(null);
      await _waitFor(
        () => todayStates.any((s) => s.hasValue && s.value == TodayData.empty),
      );

      expect(todayRepo.loadTodayCalls, 0);
      expect(todayStates.last.value, same(TodayData.empty));

      sessionStream.add(_fakeSession());
      await _waitFor(
        () => todayStates.any(
          (s) => s.hasValue && s.value == _CountingTodayRepository.populated,
        ),
        reason: 'todayDataProvider must refetch after login, not stay cached empty',
      );

      expect(todayRepo.loadTodayCalls, 1);
      expect(todayStates.last.value, _CountingTodayRepository.populated);
      expect(todayStates.last.value!.medicationCount, 2);
    });

    test('medsDataProvider re-executes and loads data after login', () async {
      final sessionStream = StreamController<Session?>();
      final medsRepo = _CountingMedsRepository();
      final container = ProviderContainer(
        overrides: [
          authSessionProvider.overrideWith((ref) => sessionStream.stream),
          authRepositoryProvider.overrideWith(
            (ref) async => _FakeAuthRepository(),
          ),
          medsRepositoryProvider.overrideWithValue(medsRepo),
        ],
      );
      addTearDown(() {
        unawaited(sessionStream.close());
        container.dispose();
      });

      final medsStates = <AsyncValue<MedsData>>[];
      final medsSub = container.listen(
        medsDataProvider,
        (_, next) => medsStates.add(next),
        fireImmediately: true,
      );
      addTearDown(medsSub.close);

      sessionStream.add(null);
      await _waitFor(
        () => medsStates.any((s) => s.hasValue && s.value == MedsData.empty),
      );

      expect(medsRepo.loadMedsCalls, 0);
      expect(medsStates.last.value, same(MedsData.empty));

      sessionStream.add(_fakeSession());
      await _waitFor(
        () => medsStates.any(
          (s) => s.hasValue && s.value == _CountingMedsRepository.populated,
        ),
        reason: 'medsDataProvider must refetch after login, not stay cached empty',
      );

      expect(medsRepo.loadMedsCalls, 1);
      expect(medsStates.last.value, _CountingMedsRepository.populated);
      expect(medsStates.last.value!.medications, hasLength(1));
    });

    test('watching authSessionProvider AsyncValue invalidates on login', () async {
      final sessionStream = StreamController<Session?>();
      final container = ProviderContainer(
        overrides: [
          authSessionProvider.overrideWith((ref) => sessionStream.stream),
        ],
      );
      addTearDown(() {
        unawaited(sessionStream.close());
        container.dispose();
      });

      final sessionStates = <AsyncValue<Session?>>[];
      container.listen(
        authSessionProvider,
        (_, next) => sessionStates.add(next),
        fireImmediately: true,
      );

      sessionStream.add(null);
      await _waitFor(() => sessionStates.any((s) => s.hasValue && s.value == null));

      sessionStream.add(_fakeSession());
      await _waitFor(
        () => sessionStates.any((s) => s.hasValue && s.value != null),
      );

      expect(sessionStates.last.value?.user.email, 'test@purplelife.org');
    });
  });
}

Future<void> _waitFor(
  bool Function() condition, {
  Duration timeout = const Duration(seconds: 2),
  String? reason,
}) async {
  final deadline = DateTime.now().add(timeout);
  while (!condition()) {
    if (DateTime.now().isAfter(deadline)) {
      fail(reason ?? 'Timed out waiting for condition');
    }
    await Future<void>.delayed(Duration.zero);
  }
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

class _FakeAuthRepository implements AuthRepository {
  @override
  bool get isAuthenticated => false;

  @override
  Session? get currentSession => null;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _CountingTodayRepository implements TodayRepository {
  _CountingTodayRepository();

  int loadTodayCalls = 0;

  static final populated = TodayData(
    scores: ScoreSnapshot(readiness: 85, hasData: true),
    firstName: 'Test',
    medicationCount: 2,
    journalEntryCount: 2,
    loadedAt: DateTime(2026, 7, 4),
  );

  @override
  Future<TodayData> loadToday({String? dateYmd}) async {
    loadTodayCalls++;
    return populated;
  }

  @override
  Future<ScoreSnapshot> loadScoreSnapshot({String? dateYmd}) async {
    return populated.scores;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _CountingMedsRepository implements MedsRepository {
  _CountingMedsRepository();

  int loadMedsCalls = 0;

  static final populated = MedsData(
    medications: const [
      Medication(
        id: 'med-1',
        name: 'Keppra',
        active: true,
        kind: 'daily',
        isRescue: false,
      ),
    ],
    todayDoses: const [],
    isOffline: false,
    loadedAt: DateTime(2026, 7, 4),
  );

  @override
  Future<MedsData> loadMeds({String? viewDateYmd}) async {
    loadMedsCalls++;
    return populated;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
