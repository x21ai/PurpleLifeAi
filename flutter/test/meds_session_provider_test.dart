import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/auth/auth_repository.dart';
import 'package:purple_app/core/providers/core_providers.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/meds/models/dose.dart';
import 'package:purple_app/features/meds/models/medication.dart';
import 'package:purple_app/features/today/today_meds_section.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// After password sign-in, [authSessionProvider] can stay [AsyncData] null while
/// [AuthRepository.currentSession] is already set. Meds providers must use
/// [readActiveSession] or Today shows empty doses and Taken never appears.
void main() {
  group('meds providers readActiveSession', () {
    test('medsDataProvider loads when stream is null but repo has session',
        () async {
      final sessionStream = StreamController<Session?>();
      final medsRepo = _CountingMedsRepository();
      final auth = _SessionHoldingAuthRepository(_fakeSession());
      final container = ProviderContainer(
        overrides: [
          authSessionProvider.overrideWith((ref) => sessionStream.stream),
          authRepositoryProvider.overrideWith((ref) async => auth),
          medsRepositoryProvider.overrideWithValue(medsRepo),
        ],
      );
      addTearDown(() {
        unawaited(sessionStream.close());
        container.dispose();
      });

      sessionStream.add(null);

      final states = <AsyncValue<MedsData>>[];
      final sub = container.listen(
        medsDataProvider,
        (_, next) => states.add(next),
        fireImmediately: true,
      );
      addTearDown(sub.close);

      await _waitFor(
        () => states.any(
          (s) => s.hasValue && s.value == _CountingMedsRepository.populated,
        ),
        reason:
            'medsDataProvider must use AuthRepository.currentSession when '
            'authSessionProvider.valueOrNull is null after password sign-in',
      );

      expect(medsRepo.loadMedsCalls, greaterThanOrEqualTo(1));
      expect(states.last.value!.todayDoses, isNotEmpty);
      expect(states.last.value!.todayDoses.first.medication?.name, 'Crestor');
    });

    test('medsForDayProvider loads when stream is null but repo has session',
        () async {
      final sessionStream = StreamController<Session?>();
      final medsRepo = _CountingMedsRepository();
      final auth = _SessionHoldingAuthRepository(_fakeSession());
      final todayYmd = '2026-07-12';
      final container = ProviderContainer(
        overrides: [
          authSessionProvider.overrideWith((ref) => sessionStream.stream),
          authRepositoryProvider.overrideWith((ref) async => auth),
          medsRepositoryProvider.overrideWithValue(medsRepo),
        ],
      );
      addTearDown(() {
        unawaited(sessionStream.close());
        container.dispose();
      });

      sessionStream.add(null);

      final states = <AsyncValue<MedsData>>[];
      final sub = container.listen(
        medsForDayProvider(todayYmd),
        (_, next) => states.add(next),
        fireImmediately: true,
      );
      addTearDown(sub.close);

      await _waitFor(
        () => states.any(
          (s) => s.hasValue && s.value == _CountingMedsRepository.populated,
        ),
        reason:
            'medsForDayProvider must not return MedsData.empty when only the '
            'session stream lags after password sign-in',
      );

      expect(medsRepo.loadMedsCalls, greaterThanOrEqualTo(1));
      expect(states.last.value!.todayDoses.single.status, 'pending');
    });
  });
}

Future<void> _waitFor(
  bool Function() condition, {
  String? reason,
  Duration timeout = const Duration(seconds: 3),
}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    if (condition()) return;
    await Future<void>.delayed(const Duration(milliseconds: 20));
  }
  fail(reason ?? 'condition not met within $timeout');
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

class _SessionHoldingAuthRepository implements AuthRepository {
  _SessionHoldingAuthRepository(this._session);

  final Session _session;

  @override
  bool get isAuthenticated => true;

  @override
  Session? get currentSession => _session;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _CountingMedsRepository implements MedsRepository {
  _CountingMedsRepository();

  int loadMedsCalls = 0;

  static final populated = MedsData(
    medications: const [
      Medication(
        id: 'med-crestor',
        name: 'Crestor',
        active: true,
        kind: 'medication',
        isRescue: false,
        timesOfDay: ['10:00'],
      ),
    ],
    todayDoses: [
      MedicationDose(
        id: 'dose-crestor',
        medicationId: 'med-crestor',
        scheduledAt: DateTime.utc(2026, 7, 12, 14),
        status: 'pending',
        medication: const Medication(
          id: 'med-crestor',
          name: 'Crestor',
          active: true,
          kind: 'medication',
          isRescue: false,
          timesOfDay: ['10:00'],
        ),
      ),
    ],
    isOffline: false,
    loadedAt: DateTime(2026, 7, 12),
  );

  @override
  Future<MedsData> loadMeds({String? viewDateYmd}) async {
    loadMedsCalls++;
    return populated;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
