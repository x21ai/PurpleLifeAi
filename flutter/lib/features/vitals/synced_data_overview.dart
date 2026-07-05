import 'vitals_repository.dart';

/// One wearable or health platform row in the synced-data summary.
class SyncedSourceRow {
  const SyncedSourceRow({
    required this.sourceKey,
    required this.label,
    required this.coverageDays,
    this.lastSyncAt,
    required this.connected,
  });

  final String sourceKey;
  final String label;

  /// Distinct calendar days with readings in the coverage window.
  final int coverageDays;

  /// ISO timestamp of the most recent provider sync or reading.
  final String? lastSyncAt;

  /// Token row exists or readings arrived from this source recently.
  final bool connected;

  bool get hasReadings => coverageDays > 0;
}

/// Aggregated synced-data view for My Body, Vitals, and Tools.
class SyncedDataOverview {
  const SyncedDataOverview({
    required this.sources,
    this.windowDays = 90,
  });

  final List<SyncedSourceRow> sources;
  final int windowDays;

  static const empty = SyncedDataOverview(sources: []);

  bool get hasAnyReadings => sources.any((s) => s.hasReadings);

  bool get hasAnyConnection => sources.any((s) => s.connected);

  WearableCoverage get coverage => WearableCoverage(
        daysBySource: {
          for (final row in sources) row.sourceKey: row.coverageDays,
        },
        lastReadingBySource: {
          for (final row in sources)
            if (row.lastSyncAt != null) row.sourceKey: row.lastSyncAt!,
        },
      );

  int daysForSource(String sourceKey) {
    for (final row in sources) {
      if (row.sourceKey == sourceKey) return row.coverageDays;
    }
    return 0;
  }

  static const sourceOrder = [
    'oura',
    'whoop',
    'apple_health',
    'health_connect',
  ];

  static const sourceLabels = {
    'oura': 'Oura',
    'whoop': 'Whoop',
    'apple_health': 'Apple Health',
    'health_connect': 'Health Connect',
  };

  /// Pure merge for tests and repository assembly.
  static SyncedDataOverview merge({
    required WearableCoverage coverage,
    required Map<String, String?> tokenLastSync,
    required Map<String, bool> tokenConnected,
    int windowDays = 90,
  }) {
    final keys = <String>{
      ...sourceOrder,
      ...coverage.daysBySource.keys,
      ...tokenLastSync.keys,
      ...tokenConnected.keys,
    };

    String? pickLastSync(String key) {
      final token = tokenLastSync[key];
      final reading = coverage.lastReadingBySource[key];
      if (token == null) return reading;
      if (reading == null) return token;
      final tokenDt = DateTime.tryParse(token);
      final readingDt = DateTime.tryParse(reading);
      if (tokenDt == null) return reading;
      if (readingDt == null) return token;
      return tokenDt.isAfter(readingDt) ? token : reading;
    }

    final rows = <SyncedSourceRow>[];
    for (final key in sourceOrder) {
      if (!keys.contains(key)) continue;
      final days = coverage.daysForSource(key);
      final connected = tokenConnected[key] == true || days > 0;
      if (!connected && days == 0) continue;
      rows.add(
        SyncedSourceRow(
          sourceKey: key,
          label: sourceLabels[key] ?? key,
          coverageDays: days,
          lastSyncAt: pickLastSync(key),
          connected: connected,
        ),
      );
    }

    for (final key in keys) {
      if (sourceOrder.contains(key)) continue;
      final days = coverage.daysForSource(key);
      if (days == 0 && tokenConnected[key] != true) continue;
      rows.add(
        SyncedSourceRow(
          sourceKey: key,
          label: sourceLabels[key] ?? key,
          coverageDays: days,
          lastSyncAt: pickLastSync(key),
          connected: tokenConnected[key] == true || days > 0,
        ),
      );
    }

    rows.sort((a, b) => b.coverageDays.compareTo(a.coverageDays));
    return SyncedDataOverview(sources: rows, windowDays: windowDays);
  }
}

String syncedRelativeTime(String? iso) {
  if (iso == null) return 'never';
  final parsed = DateTime.tryParse(iso);
  if (parsed == null) return 'never';
  final minutes = DateTime.now().difference(parsed).inMinutes;
  if (minutes < 1) return 'just now';
  if (minutes < 60) return '$minutes min ago';
  final hours = (minutes / 60).round();
  if (hours < 24) return '${hours}h ago';
  return '${(hours / 24).round()}d ago';
}
