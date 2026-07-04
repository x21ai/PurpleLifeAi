/// Canonical metric keys and display labels for vitals and biometrics.
/// Ported from `src/lib/biometric-metrics.ts` and `src/lib/metric-naming.ts`.
library;

/// Wearable score snapshot fields (maps to `biometrics` columns).
abstract final class BiometricMetricKeys {
  static const readiness = 'oura_readiness_score';
  static const sleepScore = 'sleep_score';
  static const activityScore = 'oura_activity_score';
  static const stress = 'oura_stress_score';
  static const hrvMs = 'hrv_rmssd_ms';
  static const restingHr = 'resting_hr_bpm';
  static const vo2Max = 'vo2_max';
  static const spo2 = 'spo2_pct';
  static const steps = 'steps';
  static const respiratoryRate = 'respiratory_rate_bpm';
  static const bodyTempDeviation = 'body_temp_deviation_c';
}

/// Human-readable labels for Today and Vitals surfaces.
abstract final class MetricLabels {
  static const readiness = 'Readiness';
  static const sleep = 'Sleep';
  static const activity = 'Activity';
  static const stress = 'Stress';
  static const hrv = 'HRV';
  static const restingHr = 'Resting HR';
  static const spo2 = 'SpO₂';
  static const steps = 'Steps';
  static const vo2Max = 'VO₂ max';
  static const readinessScore = 'Readiness Score';
  static const sleepScore = 'Sleep Score';
  static const activityScore = 'Activity Score';
  static const daytimeStress = 'Daytime Stress';
  static const cardioCapacity = 'Cardio Capacity';
  static const restingHeartRate = 'Resting Heart Rate';
  static const stepsAvg30 = '30-day steps';
  static const symptomRadar = 'Symptom Radar';
  static const bodyClock = 'Body Clock';
  static const glucose = 'Glucose';
  static const meals = 'Meals';
}

/// Units shown beside metric values.
abstract final class MetricUnits {
  static const ms = 'ms';
  static const bpm = 'bpm';
  static const percent = '%';
  static const vo2Sub = 'VO₂max';
}

/// Lab report metric keys from `metric-naming.ts` used on vitals-adjacent flows.
abstract final class ReportMetricKeys {
  static const glucose = 'glucose';
  static const fastingGlucose = 'fasting_glucose';
  static const bloodGlucose = 'blood_glucose';
  static const weight = 'weight';
  static const bodyWeight = 'body_weight';
}
