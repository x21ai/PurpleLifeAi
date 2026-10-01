import '../../core/offline/supabase_row_parse.dart';

/// One local calendar day in the Last 7 days trend grid.
class TrendDayPoint {
  const TrendDayPoint({
    required this.date,
    this.sleepMin,
    this.hrvMs,
    this.readiness,
    this.activity,
    this.steps,
    this.missedDoses = 0,
  });

  /// Local `yyyy-MM-dd`.
  final String date;
  final double? sleepMin;
  final double? hrvMs;
  final double? readiness;
  final double? activity;
  final double? steps;
  final int missedDoses;
}

/// Descriptive 7-day snapshot. Null metrics mean no captured reading.
///
/// Mirrors web `getSevenDayTrends` (sleep, HRV, missed doses) and adds the
/// merged-preview rows that the same biometrics already carry (readiness,
/// activity, steps). Values are never invented.
class SevenDayTrends {
  const SevenDayTrends({
    this.days = const [],
    this.sleepAvgMin,
    this.sleepDebtMin,
    this.hrvAvgMs,
    this.hrvDelta14d,
    this.activityAvg,
    this.stepsAvg,
    this.readinessDaysAbove80 = 0,
    this.readinessDaysWithData = 0,
    this.missedDoses = 0,
    this.dosesInWindow = 0,
  });

  static const empty = SevenDayTrends();

  static const sleepTargetMin = 7.5 * 60;

  final List<TrendDayPoint> days;
  final int? sleepAvgMin;
  final int? sleepDebtMin;
  final int? hrvAvgMs;
  final int? hrvDelta14d;
  final int? activityAvg;
  final int? stepsAvg;
  final int readinessDaysAbove80;
  final int readinessDaysWithData;
  final int missedDoses;
  final int dosesInWindow;

  bool get hasTrendData =>
      sleepAvgMin != null ||
      hrvAvgMs != null ||
      activityAvg != null ||
      stepsAvg != null ||
      readinessDaysWithData > 0 ||
      dosesInWindow > 0;
}

class TrendBio {
  const TrendBio({
    required this.recordedAt,
    this.sleepMin,
    this.hrvMs,
    this.readiness,
    this.activity,
    this.steps,
  });

  final DateTime recordedAt;
  final double? sleepMin;
  final double? hrvMs;
  final double? readiness;
  final double? activity;
  final double? steps;
}

class TrendDose {
  const TrendDose({required this.scheduledAt, required this.status});

  final DateTime scheduledAt;
  final String status;
}

TrendBio? trendBioFromRow(Map<String, dynamic> row) {
  final recorded = parseSupabaseDateTime(row['recorded_at']);
  if (recorded == null) return null;
  return TrendBio(
    recordedAt: recorded,
    sleepMin: _asDouble(row['sleep_total_min']),
    hrvMs: _asDouble(row['hrv_rmssd_ms']),
    readiness: _asDouble(row['oura_readiness_score']),
    activity: _asDouble(row['oura_activity_score']),
    steps: _asDouble(row['steps']),
  );
}

TrendDose? trendDoseFromRow(Map<String, dynamic> row) {
  final at = parseSupabaseDateTime(row['scheduled_at']);
  if (at == null) return null;
  final status = row['status']?.toString() ?? 'pending';
  return TrendDose(scheduledAt: at, status: status);
}

String formatSleepMinutes(int minutes) {
  final h = minutes ~/ 60;
  final m = minutes.abs() % 60;
  return '${h}h ${m.toString().padLeft(2, '0')}m';
}

/// Last 7 local days, oldest to newest, ending on [now]'s calendar day.
SevenDayTrends computeSevenDayTrends({
  required List<TrendBio> bios,
  required List<TrendDose> doses,
  DateTime? now,
}) {
  final clock = (now ?? DateTime.now()).toLocal();
  final today = DateTime(clock.year, clock.month, clock.day);
  final since14 = clock.subtract(const Duration(days: 14));
  final since7 = clock.subtract(const Duration(days: 7));

  final byDay = <String, _DayAccum>{};
  for (final bio in bios) {
    final local = bio.recordedAt.toLocal();
    final key = _dayKey(local);
    final prev = byDay[key] ?? _DayAccum();
    prev.sleep = _maxNullable(prev.sleep, bio.sleepMin);
    prev.hrv = _maxNullable(prev.hrv, bio.hrvMs);
    prev.readiness = _maxNullable(prev.readiness, bio.readiness);
    prev.activity = _maxNullable(prev.activity, bio.activity);
    prev.steps = _maxNullable(prev.steps, bio.steps);
    byDay[key] = prev;
  }

  final missedByDay = <String, int>{};
  var dosesInWindow = 0;
  for (final dose in doses) {
    final local = dose.scheduledAt.toLocal();
    if (local.isBefore(today.subtract(const Duration(days: 6)))) continue;
    if (local.isAfter(today.add(const Duration(days: 1)))) continue;
    dosesInWindow += 1;
    if (dose.status != 'missed' && dose.status != 'skipped') continue;
    final key = _dayKey(local);
    missedByDay[key] = (missedByDay[key] ?? 0) + 1;
  }

  final days = <TrendDayPoint>[];
  for (var i = 0; i < 7; i++) {
    final day = today.subtract(Duration(days: 6 - i));
    final key = _dayKey(day);
    final row = byDay[key];
    days.add(
      TrendDayPoint(
        date: key,
        sleepMin: row?.sleep,
        hrvMs: row?.hrv,
        readiness: row?.readiness,
        activity: row?.activity,
        steps: row?.steps,
        missedDoses: missedByDay[key] ?? 0,
      ),
    );
  }

  final sleeps = days.map((d) => d.sleepMin).whereType<double>().toList();
  final sleepAvg = sleeps.isEmpty ? null : _avgRound(sleeps);
  final sleepDebt = sleeps.length == 7
      ? (SevenDayTrends.sleepTargetMin * 7 - sleeps.reduce((a, b) => a + b))
          .round()
          .clamp(0, 1 << 30)
      : null;

  final hrvs = days.map((d) => d.hrvMs).whereType<double>().toList();
  final hrvAvg = hrvs.isEmpty ? null : _avgRound(hrvs);

  final prior = <double>[];
  for (final bio in bios) {
    final at = bio.recordedAt.toLocal();
    if (at.isBefore(since14) || !at.isBefore(since7)) continue;
    final hrv = bio.hrvMs;
    if (hrv != null) prior.add(hrv);
  }
  final hrvPriorAvg = prior.isEmpty
      ? null
      : prior.reduce((a, b) => a + b) / prior.length;
  final hrvDelta = hrvAvg != null && hrvPriorAvg != null
      ? (hrvAvg - hrvPriorAvg).round()
      : null;

  final activities =
      days.map((d) => d.activity).whereType<double>().toList();
  final steps = days.map((d) => d.steps).whereType<double>().toList();
  final readinessDays =
      days.where((d) => d.readiness != null).length;
  final readinessHigh =
      days.where((d) => (d.readiness ?? -1) >= 80).length;
  final missed = days.fold<int>(0, (sum, d) => sum + d.missedDoses);

  return SevenDayTrends(
    days: days,
    sleepAvgMin: sleepAvg,
    sleepDebtMin: sleepDebt,
    hrvAvgMs: hrvAvg,
    hrvDelta14d: hrvDelta,
    activityAvg: activities.isEmpty ? null : _avgRound(activities),
    stepsAvg: steps.isEmpty ? null : _avgRound(steps),
    readinessDaysAbove80: readinessHigh,
    readinessDaysWithData: readinessDays,
    missedDoses: missed,
    dosesInWindow: dosesInWindow,
  );
}

class _DayAccum {
  double? sleep;
  double? hrv;
  double? readiness;
  double? activity;
  double? steps;
}

double? _maxNullable(double? current, double? next) {
  if (next == null) return current;
  if (current == null || next > current) return next;
  return current;
}

int _avgRound(List<double> values) {
  final sum = values.reduce((a, b) => a + b);
  return (sum / values.length).round();
}

String _dayKey(DateTime local) {
  final d = DateTime(local.year, local.month, local.day);
  final y = d.year.toString().padLeft(4, '0');
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '$y-$m-$day';
}

double? _asDouble(Object? value) {
  if (value is num) return value.toDouble();
  if (value is String && value.isNotEmpty) return double.tryParse(value);
  return null;
}
