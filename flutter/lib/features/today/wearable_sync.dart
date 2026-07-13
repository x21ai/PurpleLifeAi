import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/api/worker_client.dart';
import '../health/health_service.dart';
import '../health/native_health_autosync.dart';

const _pullProviders = <({String id, String tokensTable})>[
  (id: 'oura', tokensTable: 'oura_tokens'),
  (id: 'whoop', tokensTable: 'whoop_tokens'),
];

/// Cap for connection checks and each provider sync so pull-to-refresh cannot
/// hang forever on a stalled edge function, Worker, or HealthKit read.
const wearableSyncTimeout = Duration(seconds: 20);

/// Matches web `SYNC_THROTTLE_MS` in `src/lib/wearable-sync.ts`.
const wearableVisitSyncThrottle = Duration(hours: 3);

/// Fail-open wrapper: timeouts and errors return [onTimeout] / null instead of
/// blocking the RefreshIndicator.
Future<T?> guardWearableSyncStep<T>(
  Future<T> future, {
  required String label,
  T? onTimeout,
  Duration timeout = wearableSyncTimeout,
}) async {
  try {
    return await future.timeout(timeout);
  } on TimeoutException catch (error, stack) {
    debugPrint(
      '[wearable_sync] $label timed out after ${timeout.inSeconds}s: $error\n$stack',
    );
    return onTimeout;
  } catch (error, stack) {
    debugPrint('[wearable_sync] $label failed: $error\n$stack');
    return null;
  }
}

/// Whether a pull wearable should sync on app open (visit mode + 3h throttle).
///
/// Mirrors web `useWearableAutoSync`: missing `sync_mode` defaults to `visit`;
/// [force] bypasses the throttle (pull-to-refresh / Sync now).
@visibleForTesting
bool shouldVisitSyncProvider({
  required String? syncMode,
  required String? lastSyncAt,
  required String? updatedAt,
  required DateTime now,
  Duration throttle = wearableVisitSyncThrottle,
  bool force = false,
}) {
  final mode = syncMode ?? 'visit';
  if (mode != 'visit') return false;
  if (force) return true;
  final lastIso = lastSyncAt ?? updatedAt;
  if (lastIso == null) return true;
  final last = DateTime.tryParse(lastIso);
  if (last == null) return true;
  return now.difference(last) >= throttle;
}

/// On-open visit-mode sync for connected Oura/Whoop (web `useWearableAutoSync`).
///
/// Interval/manual/pull modes are not handled here. Fail-open per provider.
Future<void> syncVisitModeWearables({
  required SupabaseClient supabase,
  WorkerClient? worker,
  bool force = false,
  DateTime? now,
}) async {
  final uid = supabase.auth.currentSession?.user.id;
  if (uid == null) return;
  final clock = now ?? DateTime.now();

  for (final provider in _pullProviders) {
    final row = await guardWearableSyncStep<Map<String, dynamic>?>(
      supabase
          .from(provider.tokensTable)
          .select('sync_mode, last_sync_at, updated_at')
          .eq('user_id', uid)
          .maybeSingle(),
      label: 'visit connection ${provider.id}',
    );
    if (row == null) continue;

    final shouldSync = shouldVisitSyncProvider(
      syncMode: row['sync_mode'] as String?,
      lastSyncAt: row['last_sync_at'] as String?,
      updatedAt: row['updated_at'] as String?,
      now: clock,
      force: force,
    );
    if (!shouldSync) continue;

    if (provider.id == 'oura') {
      await guardWearableSyncStep(
        supabase.functions.invoke(
          'oura-sync',
          body: const {'action': 'incremental'},
        ),
        label: 'oura visit sync',
      );
    } else if (provider.id == 'whoop') {
      final client = worker;
      if (client == null) continue;
      final result = await guardWearableSyncStep(
        client.postWhoopIncrementalSync(),
        label: 'whoop visit sync',
      );
      if (result != null && result['ok'] == false) {
        debugPrint(
          '[wearable_sync] Whoop visit sync reconnect: ${result['message']}',
        );
      }
    }
  }
}

/// Syncs every connected pull wearable (Oura edge + Whoop Worker).
/// Fail-open per provider, matching web `today.tsx` / `sync-status.tsx`.
Future<void> syncConnectedWearables({
  required SupabaseClient supabase,
  WorkerClient? worker,
}) async {
  final uid = supabase.auth.currentSession?.user.id;
  if (uid == null) return;

  final connected = <String>[];
  for (final provider in _pullProviders) {
    final row = await guardWearableSyncStep<Map<String, dynamic>?>(
      supabase
          .from(provider.tokensTable)
          .select('user_id')
          .eq('user_id', uid)
          .maybeSingle(),
      label: 'connection check ${provider.id}',
    );
    if (row != null) connected.add(provider.id);
  }

  if (connected.isEmpty) {
    await _syncNativeHealth(
      supabase: supabase,
      worker: worker,
      force: true,
    );
    return;
  }

  await Future.wait([
    Future.wait(
      connected.map((id) async {
        if (id == 'oura') {
          await guardWearableSyncStep(
            supabase.functions.invoke(
              'oura-sync',
              body: const {'action': 'incremental'},
            ),
            label: 'oura sync',
          );
        } else if (id == 'whoop') {
          final client = worker;
          if (client == null) return;
          final result = await guardWearableSyncStep(
            client.postWhoopIncrementalSync(),
            label: 'whoop sync',
          );
          if (result != null && result['ok'] == false) {
            debugPrint(
              '[wearable_sync] Whoop reconnect required: ${result['message']}',
            );
          }
        }
      }),
    ),
    _syncNativeHealth(
      supabase: supabase,
      worker: worker,
      force: true,
    ),
  ]);
}

/// Pull-to-refresh and visit-mode native HealthKit sync (device auth gated).
Future<void> _syncNativeHealth({
  required SupabaseClient supabase,
  WorkerClient? worker,
  required bool force,
}) async {
  if (!isNativeHealthPlatform || worker == null) return;

  final health = HealthService();
  final sync = buildNativeHealthSync(workerClient: worker);
  await guardWearableSyncStep(
    syncNativeHealthIfAuthorized(
      healthService: health,
      syncClient: sync,
      supabase: supabase,
      force: force,
    ),
    label: 'native health sync',
  );
}
