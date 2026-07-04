import '../../core/api/worker_client.dart';
import 'health_service.dart';

/// Pushes native HealthKit / Health Connect samples to the Worker API.
class NativeHealthSync {
  NativeHealthSync({required WorkerClient workerClient})
      : _worker = workerClient;

  final WorkerClient _worker;

  static const maxBatchSize = 2000;

  /// POST `/api/health/native-sync` with bearer auth.
  Future<NativeHealthSyncResult> syncDays({
    required String source,
    required List<NativeHealthDay> days,
  }) async {
    if (days.isEmpty) {
      return const NativeHealthSyncResult(ok: true, upserted: 0);
    }

    var totalUpserted = 0;
    for (var i = 0; i < days.length; i += maxBatchSize) {
      final end = (i + maxBatchSize < days.length) ? i + maxBatchSize : days.length;
      final chunk = days.sublist(i, end);
      final response = await _worker.postNativeHealthSync(
        source: source,
        samples: chunk.map((d) => d.toSyncJson()).toList(),
      );
      totalUpserted += (response['upserted'] as num?)?.toInt() ?? chunk.length;
    }

    return NativeHealthSyncResult(ok: true, upserted: totalUpserted);
  }

  /// Reads device metrics and uploads them for the current platform source.
  Future<NativeHealthSyncResult> readAndSync({
    required HealthService healthService,
    int daysBack = 90,
  }) async {
    final days = await healthService.readMetrics(daysBack: daysBack);
    if (days.isEmpty) {
      return const NativeHealthSyncResult(ok: true, upserted: 0, empty: true);
    }
    final source = days.first.source;
    return syncDays(source: source, days: days);
  }
}

class NativeHealthSyncResult {
  const NativeHealthSyncResult({
    required this.ok,
    required this.upserted,
    this.empty = false,
  });

  final bool ok;
  final int upserted;
  final bool empty;
}
