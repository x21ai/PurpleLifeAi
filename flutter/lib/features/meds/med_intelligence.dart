import 'models/dose.dart';
import 'models/medication.dart';

/// Time-of-day bucket matching web `TimeBucket` in med-intelligence.
enum MedTimeBucket { morning, midday, evening, night }

class RefillProjection {
  const RefillProjection({
    required this.medId,
    required this.name,
    required this.pillsRemaining,
    required this.dosesPerDay,
    required this.daysLeft,
    required this.runoutDate,
    required this.threshold,
  });

  final String medId;
  final String name;
  final int pillsRemaining;
  final int dosesPerDay;
  final int daysLeft;
  final DateTime runoutDate;
  final int threshold;

  bool get isSoon => daysLeft <= (threshold > 14 ? threshold : 14);
}

class MissedDosePattern {
  const MissedDosePattern({
    required this.bucket,
    required this.missed,
    required this.scheduled,
    required this.pct,
  });

  final MedTimeBucket bucket;
  final int missed;
  final int scheduled;
  final int pct;
}

/// Refill forecast and adherence extras derived from the user's own rows.
///
/// Port of `getMedIntelligence`. Descriptive only: no clinical advice and no
/// placeholder counts when pills or doses are absent.
class MedIntelligence {
  const MedIntelligence({
    this.refills = const [],
    this.streakDays = 0,
    this.missedPattern,
    this.onTimePct14d,
  });

  static const empty = MedIntelligence();

  final List<RefillProjection> refills;
  final int streakDays;
  final MissedDosePattern? missedPattern;
  final int? onTimePct14d;

  List<RefillProjection> get soonRefills =>
      refills.where((refill) => refill.isSoon).toList(growable: false);

  bool get showStreak => streakDays > 0;
  bool get showPattern => missedPattern != null;
  bool get showExtras => showStreak || showPattern;
}

String medTimeBucketLabel(MedTimeBucket bucket) {
  return switch (bucket) {
    MedTimeBucket.morning => 'morning',
    MedTimeBucket.midday => 'midday',
    MedTimeBucket.evening => 'evening',
    MedTimeBucket.night => 'night',
  };
}

MedTimeBucket medBucketForHour(int hour) {
  if (hour < 5) return MedTimeBucket.night;
  if (hour < 12) return MedTimeBucket.morning;
  if (hour < 17) return MedTimeBucket.midday;
  if (hour < 22) return MedTimeBucket.evening;
  return MedTimeBucket.night;
}

MedIntelligence computeMedIntelligence({
  required List<Medication> medications,
  required List<MedicationDose> recentDoses,
  DateTime? now,
}) {
  final clock = (now ?? DateTime.now()).toLocal();
  final since30 = clock.subtract(const Duration(days: 30));
  final since14 = clock.subtract(const Duration(days: 14));

  final refills = <RefillProjection>[];
  for (final med in medications) {
    if (!med.active || med.isRescueMed) continue;
    final remaining = med.pillsRemaining;
    if (remaining == null) continue;
    final pills = remaining.round();
    final perDay = med.timesOfDay.isEmpty ? 1 : med.timesOfDay.length;
    final daysLeft = pills <= 0 ? 0 : pills ~/ perDay;
    final runout = DateTime(clock.year, clock.month, clock.day)
        .add(Duration(days: daysLeft));
    refills.add(
      RefillProjection(
        medId: med.id,
        name: med.name,
        pillsRemaining: pills,
        dosesPerDay: perDay,
        daysLeft: daysLeft,
        runoutDate: runout,
        threshold: (med.refillThreshold ?? 7).round(),
      ),
    );
  }
  refills.sort((a, b) => a.daysLeft.compareTo(b.daysLeft));

  final recent14 = recentDoses.where((dose) {
    final at = dose.scheduledAt.toLocal();
    return !at.isBefore(since14) && !at.isAfter(clock);
  }).toList();
  final onTimePct14d = recent14.isEmpty
      ? null
      : ((recent14.where((d) => d.status == 'taken').length / recent14.length) *
              100)
          .round();

  final byDay = <String, List<MedicationDose>>{};
  for (final dose in recentDoses) {
    final key = _dayKey(dose.scheduledAt.toLocal());
    (byDay[key] ??= []).add(dose);
  }

  var streak = 0;
  var cursor = DateTime(clock.year, clock.month, clock.day)
      .subtract(const Duration(days: 1));
  for (var i = 0; i < 60; i++) {
    final list = byDay[_dayKey(cursor)] ?? const <MedicationDose>[];
    if (list.isEmpty) {
      cursor = cursor.subtract(const Duration(days: 1));
      continue;
    }
    final allTaken = list.every((dose) => dose.status == 'taken');
    if (!allTaken) break;
    streak += 1;
    cursor = cursor.subtract(const Duration(days: 1));
  }

  final buckets = {
    for (final bucket in MedTimeBucket.values)
      bucket: (missed: 0, scheduled: 0),
  };
  for (final dose in recentDoses) {
    final at = dose.scheduledAt.toLocal();
    if (at.isBefore(since30) || at.isAfter(clock)) continue;
    final bucket = medBucketForHour(at.hour);
    final current = buckets[bucket]!;
    final missed = dose.status == 'missed' || dose.status == 'skipped';
    buckets[bucket] = (
      missed: current.missed + (missed ? 1 : 0),
      scheduled: current.scheduled + 1,
    );
  }

  MissedDosePattern? pattern;
  for (final entry in buckets.entries) {
    final scheduled = entry.value.scheduled;
    final missed = entry.value.missed;
    if (scheduled < 6 || missed < 3) continue;
    final pct = missed / scheduled;
    if (pct < 0.4) continue;
    final othersCalmer = buckets.entries
        .where((other) => other.key != entry.key && other.value.scheduled >= 3)
        .every((other) {
      final otherPct = other.value.missed / other.value.scheduled;
      return otherPct < pct - 0.15;
    });
    if (!othersCalmer) continue;
    final rounded = (pct * 100).round();
    if (pattern == null || rounded > pattern.pct) {
      pattern = MissedDosePattern(
        bucket: entry.key,
        missed: missed,
        scheduled: scheduled,
        pct: rounded,
      );
    }
  }

  return MedIntelligence(
    refills: refills,
    streakDays: streak,
    missedPattern: pattern,
    onTimePct14d: onTimePct14d,
  );
}

String _dayKey(DateTime local) {
  final y = local.year.toString().padLeft(4, '0');
  final m = local.month.toString().padLeft(2, '0');
  final d = local.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}
