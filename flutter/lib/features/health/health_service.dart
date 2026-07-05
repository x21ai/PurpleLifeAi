import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:health/health.dart';
import 'package:url_launcher/url_launcher.dart';

/// Source slug written to `biometrics.source` for Apple HealthKit rows.
const kAppleHealthSource = 'apple_health';

/// Source slug written to `biometrics.source` for Android Health Connect rows.
const kHealthConnectSource = 'health_connect';

const _authStorageKey = 'purple:healthkit:authorized:v1';

/// Daily native health metrics ready for Worker `/api/health/native-sync`.
class NativeHealthDay {
  const NativeHealthDay({
    required this.date,
    required this.source,
    this.hrvRmssdMs,
    this.restingHrBpm,
    this.hrBpm,
    this.sleepTotalMin,
    this.sleepRemMin,
    this.sleepDeepMin,
    this.steps,
  });

  final String date;
  final String source;
  final double? hrvRmssdMs;
  final int? restingHrBpm;
  final int? hrBpm;
  final int? sleepTotalMin;
  final int? sleepRemMin;
  final int? sleepDeepMin;
  final int? steps;

  Map<String, dynamic> toSyncJson() {
    return {
      'date': date,
      if (hrvRmssdMs != null) 'hrv_rmssd_ms': hrvRmssdMs,
      if (restingHrBpm != null) 'resting_hr_bpm': restingHrBpm,
      if (hrBpm != null) 'hr_bpm': hrBpm,
      if (sleepTotalMin != null) 'sleep_total_min': sleepTotalMin,
      if (sleepRemMin != null) 'sleep_rem_min': sleepRemMin,
      if (sleepDeepMin != null) 'sleep_deep_min': sleepDeepMin,
      if (steps != null) 'steps': steps,
    };
  }

  NativeHealthDay merge({
    double? hrvRmssdMs,
    int? restingHrBpm,
    int? hrBpm,
    int? sleepTotalMin,
    int? sleepRemMin,
    int? sleepDeepMin,
    int? steps,
  }) {
    return NativeHealthDay(
      date: date,
      source: source,
      hrvRmssdMs: hrvRmssdMs ?? this.hrvRmssdMs,
      restingHrBpm: restingHrBpm ?? this.restingHrBpm,
      hrBpm: hrBpm ?? this.hrBpm,
      sleepTotalMin: sleepTotalMin ?? this.sleepTotalMin,
      sleepRemMin: sleepRemMin ?? this.sleepRemMin,
      sleepDeepMin: sleepDeepMin ?? this.sleepDeepMin,
      steps: steps ?? this.steps,
    );
  }
}

class HealthAuthStatus {
  const HealthAuthStatus({
    required this.authorized,
    this.readAuthorized = const [],
    this.readDenied = const [],
    this.reason,
  });

  final bool authorized;
  final List<String> readAuthorized;
  final List<String> readDenied;
  final String? reason;
}

class HealthAvailability {
  const HealthAvailability({required this.available, this.reason});

  final bool available;
  final String? reason;
}

/// True when HealthKit / Health Connect can run (iOS or Android only).
bool get isNativeHealthPlatform {
  if (kIsWeb) return false;
  return Platform.isIOS || Platform.isAndroid;
}

/// Reads HealthKit (iOS) or Health Connect (Android) and aggregates daily rows.
///
/// iOS auth omits [HealthDataType.VO2_MAX]; HealthKit rejects vo2Max in
/// authorization requests on iOS (see `src/lib/native/health-ios.ts`).
class HealthService {
  HealthService({FlutterSecureStorage? secureStorage})
      : _secureStorage = secureStorage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _secureStorage;
  Health? _health;

  /// iOS auth types only. No VO2_MAX.
  static const iosAuthTypes = <HealthDataType>[
    HealthDataType.STEPS,
    HealthDataType.HEART_RATE_VARIABILITY_RMSSD,
    HealthDataType.HEART_RATE,
    HealthDataType.RESTING_HEART_RATE,
    HealthDataType.SLEEP_ASLEEP,
    HealthDataType.SLEEP_REM,
    HealthDataType.SLEEP_DEEP,
  ];

  static const androidAuthTypes = <HealthDataType>[
    HealthDataType.STEPS,
    HealthDataType.HEART_RATE_VARIABILITY_RMSSD,
    HealthDataType.HEART_RATE,
    HealthDataType.SLEEP_ASLEEP,
    HealthDataType.SLEEP_REM,
    HealthDataType.SLEEP_DEEP,
  ];

  List<HealthDataType> get _authTypes =>
      Platform.isIOS ? iosAuthTypes : androidAuthTypes;

  String get _source =>
      Platform.isIOS ? kAppleHealthSource : kHealthConnectSource;

  Future<Health> _client() async {
    if (!isNativeHealthPlatform) {
      throw UnsupportedError('Native health is iOS/Android only');
    }
    final existing = _health;
    if (existing != null) return existing;
    final health = Health();
    await health.configure();
    _health = health;
    return health;
  }

  Future<HealthAvailability> isAvailable() async {
    if (!isNativeHealthPlatform) {
      return const HealthAvailability(
        available: false,
        reason: kIsWeb ? 'web' : 'unsupported_platform',
      );
    }
    if (Platform.isIOS) {
      return const HealthAvailability(available: true);
    }
    try {
      final health = await _client();
      final ok = await health.isHealthConnectAvailable();
      if (ok != true) {
        return const HealthAvailability(
          available: false,
          reason: 'health_connect_unavailable',
        );
      }
      return const HealthAvailability(available: true);
    } catch (_) {
      return const HealthAvailability(available: false, reason: 'unavailable');
    }
  }

  Future<bool> _readAuthFlag() async {
    final value = await _secureStorage.read(key: _authStorageKey);
    return value == '1';
  }

  Future<void> _writeAuthFlag(bool authorized) async {
    if (authorized) {
      await _secureStorage.write(key: _authStorageKey, value: '1');
    } else {
      await _secureStorage.delete(key: _authStorageKey);
    }
  }

  /// HealthKit never confirms READ grants; treat null as undetermined on iOS.
  Future<bool?> _readPermissionState(Health health) async {
    return health.hasPermissions(
      _authTypes,
      permissions: List.filled(_authTypes.length, HealthDataAccess.READ),
    );
  }

  /// Partial grants are OK (mirrors web `isCoreAuthorized`).
  Future<bool> _isCoreAuthorized(Health health) async {
    final state = await _readPermissionState(health);
    if (state == true) return true;
    if (Platform.isIOS) {
      return await _readAuthFlag();
    }
    return false;
  }

  Future<HealthAuthStatus> authorizationStatus() async {
    if (!isNativeHealthPlatform) {
      return const HealthAuthStatus(authorized: false, reason: 'not_native');
    }

    final availability = await isAvailable();
    if (!availability.available) {
      return HealthAuthStatus(
        authorized: false,
        reason: availability.reason ?? 'unavailable',
      );
    }

    try {
      final health = await _client();
      final permissionState = await _readPermissionState(health);

      if (permissionState == true) {
        await _writeAuthFlag(true);
        return HealthAuthStatus(
          authorized: true,
          readAuthorized: _authTypes.map((t) => t.name).toList(),
        );
      }

      if (Platform.isIOS) {
        final localFlag = await _readAuthFlag();
        if (localFlag) {
          return const HealthAuthStatus(authorized: true);
        }
      }

      if (permissionState == false) {
        await _writeAuthFlag(false);
        return HealthAuthStatus(
          authorized: false,
          readDenied: _authTypes.map((t) => t.name).toList(),
        );
      }

      return const HealthAuthStatus(authorized: false);
    } catch (e) {
      return HealthAuthStatus(
        authorized: false,
        reason: 'status_check_failed: $e',
      );
    }
  }

  Future<bool> requestPermissions() async {
    if (!isNativeHealthPlatform) return false;

    final availability = await isAvailable();
    if (!availability.available) return false;

    try {
      final health = await _client();
      final granted = await health.requestAuthorization(
        _authTypes,
        permissions: List.filled(_authTypes.length, HealthDataAccess.READ),
      );

      if (!granted) {
        await _writeAuthFlag(false);
        return false;
      }

      // iOS: requestAuthorization success is the signal; hasPermissions often
      // returns null for READ (HealthKit privacy). Match Capacitor/web flow.
      if (Platform.isIOS) {
        await _writeAuthFlag(true);
        return true;
      }

      final hasAccess = await _isCoreAuthorized(health);
      if (hasAccess) await _writeAuthFlag(true);
      return hasAccess;
    } catch (_) {
      await _writeAuthFlag(false);
      return false;
    }
  }

  /// Opens iOS Settings (Health toggles live under the Purple app entry).
  Future<bool> openHealthSettings() async {
    if (!isNativeHealthPlatform) return false;
    final uri = Platform.isIOS
        ? Uri.parse('app-settings:')
        : Uri.parse('package:org.purplelife.app');
    return launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<List<NativeHealthDay>> readMetrics({int daysBack = 90}) async {
    if (!isNativeHealthPlatform) return [];

    final availability = await isAvailable();
    if (!availability.available) return [];

    final auth = await authorizationStatus();
    if (!auth.authorized) return [];

    try {
      final health = await _client();
      final end = DateTime.now();
      final start = end.subtract(Duration(days: daysBack));
      final byDay = <String, NativeHealthDay>{};
      final hrBuckets = <String, _AvgBucket>{};
      final hrvBuckets = <String, _AvgBucket>{};

      final stepPoints = await health.getHealthDataFromTypes(
        types: [HealthDataType.STEPS],
        startTime: start,
        endTime: end,
      );
      for (final point in stepPoints) {
        final date = _dayKey(point.dateFrom);
        if (date == null) continue;
        final value = point.value;
        if (value is! NumericHealthValue) continue;
        final stepsValue = value.numericValue.round();
        if (stepsValue <= 0) continue;
        final row = _ensureDay(byDay, date);
        byDay[date] = row.merge(steps: (row.steps ?? 0) + stepsValue);
      }

      if (Platform.isIOS) {
        final restingPoints = await health.getHealthDataFromTypes(
          types: [HealthDataType.RESTING_HEART_RATE],
          startTime: start,
          endTime: end,
        );
        for (final point in restingPoints) {
          final date = _dayKey(point.dateFrom);
          if (date == null) continue;
          final value = point.value;
          if (value is! NumericHealthValue) continue;
          final bpm = value.numericValue.round();
          if (bpm <= 0) continue;
          byDay[date] = _ensureDay(byDay, date).merge(restingHrBpm: bpm);
        }
      }

      final heartPoints = await health.getHealthDataFromTypes(
        types: [HealthDataType.HEART_RATE],
        startTime: start,
        endTime: end,
      );
      for (final point in heartPoints) {
        final date = _dayKey(point.dateTo);
        if (date == null) continue;
        final value = point.value;
        if (value is! NumericHealthValue) continue;
        final bpm = value.numericValue.toDouble();
        if (bpm <= 0 || !bpm.isFinite) continue;
        hrBuckets[date] = hrBuckets[date]?.add(bpm) ?? _AvgBucket(bpm, 1);
      }

      final hrvPoints = await health.getHealthDataFromTypes(
        types: [HealthDataType.HEART_RATE_VARIABILITY_RMSSD],
        startTime: start,
        endTime: end,
      );
      for (final point in hrvPoints) {
        final date = _dayKey(point.dateTo);
        if (date == null) continue;
        final value = point.value;
        if (value is! NumericHealthValue) continue;
        final ms = value.numericValue.toDouble();
        if (ms <= 0 || !ms.isFinite) continue;
        hrvBuckets[date] = hrvBuckets[date]?.add(ms) ?? _AvgBucket(ms, 1);
      }

      final sleepPoints = await health.getHealthDataFromTypes(
        types: const [
          HealthDataType.SLEEP_ASLEEP,
          HealthDataType.SLEEP_REM,
          HealthDataType.SLEEP_DEEP,
        ],
        startTime: start,
        endTime: end,
      );
      for (final point in sleepPoints) {
        final date = _dayKey(point.dateTo);
        if (date == null) continue;
        final value = point.value;
        if (value is! NumericHealthValue) continue;
        final minutes = value.numericValue.round();
        if (minutes <= 0) continue;

        final row = _ensureDay(byDay, date);
        switch (point.type) {
          case HealthDataType.SLEEP_REM:
            byDay[date] =
                row.merge(sleepRemMin: (row.sleepRemMin ?? 0) + minutes);
          case HealthDataType.SLEEP_DEEP:
            byDay[date] =
                row.merge(sleepDeepMin: (row.sleepDeepMin ?? 0) + minutes);
          case HealthDataType.SLEEP_ASLEEP:
            byDay[date] =
                row.merge(sleepTotalMin: (row.sleepTotalMin ?? 0) + minutes);
          default:
            break;
        }
      }

      for (final entry in hrBuckets.entries) {
        if (entry.value.count == 0) continue;
        final avg = (entry.value.sum / entry.value.count).round();
        byDay[entry.key] = _ensureDay(byDay, entry.key).merge(hrBpm: avg);
      }

      for (final entry in hrvBuckets.entries) {
        if (entry.value.count == 0) continue;
        final avg =
            ((entry.value.sum / entry.value.count) * 10).roundToDouble() / 10;
        byDay[entry.key] = _ensureDay(byDay, entry.key).merge(hrvRmssdMs: avg);
      }

      final rows = byDay.values.toList()
        ..sort((a, b) => a.date.compareTo(b.date));
      return rows;
    } catch (_) {
      return [];
    }
  }

  NativeHealthDay _ensureDay(Map<String, NativeHealthDay> map, String date) {
    final existing = map[date];
    if (existing != null) return existing;
    final row = NativeHealthDay(date: date, source: _source);
    map[date] = row;
    return row;
  }

  String? _dayKey(DateTime dt) {
    final day = dt.toIso8601String().substring(0, 10);
    final pattern = RegExp(r'^\d{4}-\d{2}-\d{2}$');
    return pattern.hasMatch(day) ? day : null;
  }
}

class _AvgBucket {
  const _AvgBucket(this.sum, this.count);

  final double sum;
  final int count;

  _AvgBucket add(double value) => _AvgBucket(sum + value, count + 1);
}
