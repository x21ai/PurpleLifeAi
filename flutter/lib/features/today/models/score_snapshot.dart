/// Latest wearable scores mirroring `ScoreSnapshot` from
/// `src/lib/health-scores.functions.ts`.
class ScoreSnapshot {
  const ScoreSnapshot({
    this.readiness,
    this.sleepScore,
    this.activity,
    this.stress,
    this.hrvMs,
    this.restingHr,
    this.vo2max,
    this.spo2,
    this.steps,
    this.stepsAvg30,
    this.stepsAvg60,
    this.tempDeviationC,
    this.respRateBpm,
    this.latestAt,
    this.hasData = false,
    this.isFromCache = false,
  });

  final double? readiness;
  final double? sleepScore;
  final double? activity;
  final double? stress;
  final double? hrvMs;
  final double? restingHr;
  final double? vo2max;
  final double? spo2;
  final double? steps;
  final double? stepsAvg30;
  final double? stepsAvg60;

  /// Body temperature deviation in degrees C (web "Temp Δ" measurement).
  final double? tempDeviationC;

  /// Respiratory rate breaths/min (web "Resp /min" measurement).
  final double? respRateBpm;
  final String? latestAt;
  final bool hasData;
  final bool isFromCache;

  static const empty = ScoreSnapshot();

  ScoreSnapshot copyWith({
    double? readiness,
    double? sleepScore,
    double? activity,
    double? stress,
    double? hrvMs,
    double? restingHr,
    double? vo2max,
    double? spo2,
    double? steps,
    double? stepsAvg30,
    double? stepsAvg60,
    double? tempDeviationC,
    double? respRateBpm,
    String? latestAt,
    bool? hasData,
    bool? isFromCache,
  }) {
    return ScoreSnapshot(
      readiness: readiness ?? this.readiness,
      sleepScore: sleepScore ?? this.sleepScore,
      activity: activity ?? this.activity,
      stress: stress ?? this.stress,
      hrvMs: hrvMs ?? this.hrvMs,
      restingHr: restingHr ?? this.restingHr,
      vo2max: vo2max ?? this.vo2max,
      spo2: spo2 ?? this.spo2,
      steps: steps ?? this.steps,
      stepsAvg30: stepsAvg30 ?? this.stepsAvg30,
      stepsAvg60: stepsAvg60 ?? this.stepsAvg60,
      tempDeviationC: tempDeviationC ?? this.tempDeviationC,
      respRateBpm: respRateBpm ?? this.respRateBpm,
      latestAt: latestAt ?? this.latestAt,
      hasData: hasData ?? this.hasData,
      isFromCache: isFromCache ?? this.isFromCache,
    );
  }
}

/// A single vital tile on Today (only metrics with real values).
class TodayVitalItem {
  const TodayVitalItem({
    required this.key,
    required this.label,
    required this.value,
    this.unit,
    this.metric,
  });

  final String key;
  final String label;
  final double value;
  final String? unit;

  /// Biometrics route slug when one exists (web `/biometrics/$metric`).
  final String? metric;
}

List<TodayVitalItem> buildTodayVitalItems(ScoreSnapshot snapshot) {
  final items = <TodayVitalItem>[
    if (snapshot.readiness != null)
      TodayVitalItem(
        key: 'readiness',
        label: 'Readiness',
        value: snapshot.readiness!,
        metric: 'readiness',
      ),
    if (snapshot.sleepScore != null)
      TodayVitalItem(
        key: 'sleep',
        label: 'Sleep',
        value: snapshot.sleepScore!,
        metric: 'sleep_score',
      ),
    if (snapshot.activity != null)
      TodayVitalItem(
        key: 'activity',
        label: 'Activity',
        value: snapshot.activity!,
        metric: 'activity_score',
      ),
    if (snapshot.hrvMs != null)
      TodayVitalItem(
        key: 'hrv',
        label: 'HRV',
        value: snapshot.hrvMs!,
        unit: 'ms',
        metric: 'hrv',
      ),
    if (snapshot.restingHr != null)
      TodayVitalItem(
        key: 'rhr',
        label: 'Resting HR',
        value: snapshot.restingHr!,
        unit: 'bpm',
        metric: 'resting_hr',
      ),
    if (snapshot.spo2 != null)
      TodayVitalItem(
        key: 'spo2',
        label: 'SpO₂',
        value: snapshot.spo2!,
        unit: '%',
        metric: 'spo2',
      ),
    if (snapshot.stress != null)
      TodayVitalItem(
        key: 'stress',
        label: 'Stress',
        value: snapshot.stress!,
        metric: 'stress',
      ),
    if (snapshot.steps != null)
      TodayVitalItem(
        key: 'steps',
        label: 'Steps',
        value: snapshot.steps!,
        metric: 'steps',
      ),
    if (snapshot.vo2max != null)
      TodayVitalItem(
        key: 'vo2max',
        label: 'VO₂ max',
        value: snapshot.vo2max!,
      ),
  ];
  return items;
}
