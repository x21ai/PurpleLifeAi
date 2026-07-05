import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/api/worker_client.dart';
import '../../core/offline/sync_service.dart';
import 'health_service.dart';
import 'native_health_sync.dart';

/// Matches web `SYNC_THROTTLE_MS` in `src/lib/wearable-sync.ts`.
const nativeHealthSyncThrottle = Duration(hours: 3);

/// Background native HealthKit / Health Connect sync for visit-mode surfaces.
///
/// Gates on **device authorization** (never prior `biometrics` rows). Throttles
/// using `apple_health_tokens.last_sync_at` when present.
Future<NativeHealthSyncResult?> syncNativeHealthIfAuthorized({
  required HealthService healthService,
  required NativeHealthSync syncClient,
  SupabaseClient? supabase,
  bool force = false,
}) async {
  if (!isNativeHealthPlatform) return null;

  final auth = await healthService.authorizationStatus();
  if (!auth.authorized) return null;

  if (!force) {
    final throttled = await _isThrottled(supabase);
    if (throttled) return null;
  }

  try {
    return await syncClient.readAndSync(healthService: healthService);
  } catch (error, stack) {
    debugPrint('[native_health_autosync] sync failed: $error\n$stack');
    return null;
  }
}

Future<bool> _isThrottled(SupabaseClient? supabase) async {
  final client = supabase ?? Supabase.instance.client;
  final uid = client.auth.currentSession?.user.id;
  if (uid == null) return false;

  try {
    final token = await client
        .from('apple_health_tokens')
        .select('last_sync_at')
        .eq('user_id', uid)
        .maybeSingle();
    final lastIso = token?['last_sync_at'] as String?;
    if (lastIso == null) return false;
    final last = DateTime.tryParse(lastIso);
    if (last == null) return false;
    return DateTime.now().difference(last) < nativeHealthSyncThrottle;
  } catch (error, stack) {
    debugPrint('[native_health_autosync] throttle check failed: $error\n$stack');
    return false;
  }
}

/// Builds a [NativeHealthSync] wired to Worker + offline queue flush.
NativeHealthSync buildNativeHealthSync({
  required WorkerClient workerClient,
  SyncService? syncService,
}) {
  return NativeHealthSync(
    workerClient: workerClient,
    syncService: syncService,
  );
}
