import '../../core/api/worker_client.dart';
import '../../core/offline/sync_service.dart';
import 'health_service.dart';

/// Pushes native HealthKit / Health Connect samples to the Worker API.
class NativeHealthSync {
  NativeHealthSync({
    required WorkerClient workerClient,
    SyncService? syncService,
  })  : _worker = workerClient,
        _sync = syncService;

  final WorkerClient _worker;
  final SyncService? _sync;

  static const maxBatchSize = 2000;

  /// POST `/api/health/native-sync` with bearer auth. Queues offline when needed.
  Future<NativeHealthSyncResult> syncDays({
    required String source,
    required List<NativeHealthDay> days,
  }) async {
    if (days.isEmpty) {
      return const NativeHealthSyncResult(ok: true, upserted: 0);
    }

    var totalUpserted = 0;
    var queued = false;

    for (var i = 0; i < days.length; i += maxBatchSize) {
      final end =
          (i + maxBatchSize < days.length) ? i + maxBatchSize : days.length;
      final chunk = days.sublist(i, end);
      final samples = chunk.map((d) => d.toSyncJson()).toList();

      try {
        final response = await _worker.postNativeHealthSync(
          source: source,
          samples: samples,
        );
        if (response['skipped'] == true) {
          throw WorkerApiException(
            0,
            response['reason'] as String? ?? 'native_health_sync_skipped',
          );
        }
        totalUpserted +=
            (response['upserted'] as num?)?.toInt() ?? chunk.length;
      } on WorkerApiException {
        rethrow;
      } catch (e) {
        final sync = _sync;
        if (sync == null) rethrow;
        await sync.queueNativeHealthSync(source: source, samples: samples);
        queued = true;
      }
    }

    if (queued && totalUpserted == 0) {
      return const NativeHealthSyncResult(
        ok: true,
        upserted: 0,
        queued: true,
      );
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
    this.queued = false,
  });

  final bool ok;
  final int upserted;
  final bool empty;
  final bool queued;
}
