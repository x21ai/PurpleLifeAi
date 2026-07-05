import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/core_providers.dart';
import 'health_service.dart';
import 'native_health_autosync.dart';
import 'native_health_sync.dart';

/// Shared [HealthService] for Tools, Settings/sharing, and onboarding connect.
final healthServiceProvider = Provider<HealthService>(
  (ref) => HealthService(),
);

/// Worker-backed native health sync with offline queue flush.
final nativeHealthSyncProvider = Provider<NativeHealthSync>((ref) {
  return buildNativeHealthSync(
    workerClient: ref.watch(workerClientProvider),
    syncService: ref.watch(syncServiceProvider),
  );
});
