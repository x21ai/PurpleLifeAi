import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/today/seven_day_trends.dart';

void main() {
  final now = DateTime(2026, 7, 7, 15);

  TrendBio bio(int day, {double? sleep, double? hrv, double? ready, double? steps}) {
    return TrendBio(
      recordedAt: DateTime(2026, 7, day, 8),
      sleepMin: sleep,
      hrvMs: hrv,
      readiness: ready,
      steps: steps,
    );
  }

  test('averages captured days and omits metrics with no readings', () {
    final trends = computeSevenDayTrends(
      now: now,
      bios: [
        bio(5, sleep: 400, hrv: 30, ready: 70),
        bio(6, sleep: 420, hrv: 40, ready: 85),
        bio(7, sleep: 450, hrv: 50, ready: 90, steps: 8000),
      ],
      doses: const [],
    );

    expect(trends.days, hasLength(7));
    expect(trends.sleepAvgMin, ((400 + 420 + 450) / 3).round());
    expect(trends.sleepDebtMin, isNull);
    expect(trends.hrvAvgMs, 40);
    expect(trends.readinessDaysAbove80, 2);
    expect(trends.readinessDaysWithData, 3);
    expect(trends.stepsAvg, 8000);
    expect(trends.activityAvg, isNull);
    expect(trends.dosesInWindow, 0);
    expect(trends.hasTrendData, isTrue);
  });

  test('sleep debt only when all 7 days have sleep', () {
    final trends = computeSevenDayTrends(
      now: now,
      bios: [
        for (var day = 1; day <= 7; day++)
          bio(day, sleep: 400),
      ],
      doses: const [],
    );

    expect(trends.sleepAvgMin, 400);
    expect(
      trends.sleepDebtMin,
      (SevenDayTrends.sleepTargetMin * 7 - 400 * 7).round(),
    );
  });

  test('missed and skipped doses count inside the week only', () {
    final trends = computeSevenDayTrends(
      now: now,
      bios: const [],
      doses: [
        TrendDose(
          scheduledAt: DateTime(2026, 7, 6, 9),
          status: 'missed',
        ),
        TrendDose(
          scheduledAt: DateTime(2026, 7, 7, 9),
          status: 'skipped',
        ),
        TrendDose(
          scheduledAt: DateTime(2026, 7, 7, 21),
          status: 'taken',
        ),
        TrendDose(
          scheduledAt: DateTime(2026, 6, 20, 9),
          status: 'missed',
        ),
      ],
    );

    expect(trends.missedDoses, 2);
    expect(trends.dosesInWindow, 3);
    expect(trends.days.last.missedDoses, 1);
    expect(trends.hasTrendData, isTrue);
  });

  test('empty inputs stay empty', () {
    final trends = computeSevenDayTrends(
      now: now,
      bios: const [],
      doses: const [],
    );
    expect(trends.hasTrendData, isFalse);
    expect(trends.days, hasLength(7));
  });

  test('keeps the higher reading when a day has two rows', () {
    final trends = computeSevenDayTrends(
      now: now,
      bios: [
        bio(7, hrv: 20, sleep: 300),
        bio(7, hrv: 44, sleep: 480),
      ],
      doses: const [],
    );
    expect(trends.days.last.hrvMs, 44);
    expect(trends.days.last.sleepMin, 480);
    expect(trends.hrvAvgMs, 44);
  });
}
