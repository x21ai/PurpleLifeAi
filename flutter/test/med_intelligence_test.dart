import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/meds/med_intelligence.dart';
import 'package:purple_app/features/meds/models/dose.dart';
import 'package:purple_app/features/meds/models/medication.dart';

void main() {
  const keppra = Medication(
    id: 'm1',
    name: 'Keppra',
    active: true,
    kind: 'medication',
    isRescue: false,
    timesOfDay: ['08:00', '20:00'],
    pillsRemaining: 6,
    refillThreshold: 7,
  );

  MedicationDose dose(String id, DateTime at, String status) {
    return MedicationDose(
      id: id,
      medicationId: 'm1',
      scheduledAt: at,
      status: status,
      medication: keppra,
    );
  }

  test('projects refill days from pills and doses per day', () {
    final now = DateTime(2026, 7, 7, 12);
    final intel = computeMedIntelligence(
      now: now,
      medications: const [keppra],
      recentDoses: const [],
    );

    expect(intel.soonRefills, hasLength(1));
    final refill = intel.soonRefills.single;
    expect(refill.dosesPerDay, 2);
    expect(refill.daysLeft, 3);
    expect(refill.runoutDate, DateTime(2026, 7, 10));
    expect(refill.pillsRemaining, 6);
  });

  test('skips rescue meds and meds without a pill count', () {
    final intel = computeMedIntelligence(
      now: DateTime(2026, 7, 7),
      medications: const [
        Medication(
          id: 'r',
          name: 'Rescue',
          active: true,
          kind: 'rescue',
          isRescue: true,
          pillsRemaining: 2,
        ),
        Medication(
          id: 'u',
          name: 'Untracked',
          active: true,
          kind: 'medication',
          isRescue: false,
        ),
      ],
      recentDoses: const [],
    );
    expect(intel.refills, isEmpty);
    expect(intel.showExtras, isFalse);
  });

  test('counts an on-time streak and ignores empty days', () {
    final now = DateTime(2026, 7, 7, 18);
    final intel = computeMedIntelligence(
      now: now,
      medications: const [keppra],
      recentDoses: [
        dose('a', DateTime(2026, 7, 5, 8), 'taken'),
        dose('b', DateTime(2026, 7, 5, 20), 'taken'),
        dose('c', DateTime(2026, 7, 6, 8), 'taken'),
        dose('d', DateTime(2026, 7, 6, 20), 'taken'),
        dose('e', DateTime(2026, 7, 4, 8), 'missed'),
      ],
    );
    expect(intel.streakDays, 2);
  });

  test('flags a morning miss pattern when other buckets are calmer', () {
    final now = DateTime(2026, 7, 7, 18);
    final doses = <MedicationDose>[];
    for (var i = 0; i < 8; i++) {
      final day = DateTime(2026, 6, 20 + i, 8);
      doses.add(dose('m$i', day, i < 6 ? 'missed' : 'taken'));
      doses.add(dose('e$i', DateTime(2026, 6, 20 + i, 20), 'taken'));
    }
    final intel = computeMedIntelligence(
      now: now,
      medications: const [keppra],
      recentDoses: doses,
    );
    expect(intel.missedPattern, isNotNull);
    expect(intel.missedPattern!.bucket, MedTimeBucket.morning);
    expect(intel.missedPattern!.pct, greaterThanOrEqualTo(40));
  });
}
