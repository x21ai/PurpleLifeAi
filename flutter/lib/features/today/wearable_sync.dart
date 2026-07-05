import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/api/worker_client.dart';

const _pullProviders = <({String id, String tokensTable})>[
  (id: 'oura', tokensTable: 'oura_tokens'),
  (id: 'whoop', tokensTable: 'whoop_tokens'),
];

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
    try {
      final row = await supabase
          .from(provider.tokensTable)
          .select('user_id')
          .eq('user_id', uid)
          .maybeSingle();
      if (row != null) connected.add(provider.id);
    } catch (error, stack) {
      debugPrint(
        '[wearable_sync] connection check failed for ${provider.id}: $error\n$stack',
      );
    }
  }

  if (connected.isEmpty) return;

  await Future.wait(
    connected.map((id) async {
      try {
        if (id == 'oura') {
          await supabase.functions.invoke(
            'oura-sync',
            body: const {'action': 'incremental'},
          );
        } else if (id == 'whoop') {
          final client = worker;
          if (client == null) return;
          final result = await client.postWhoopIncrementalSync();
          if (result['ok'] == false) {
            debugPrint(
              '[wearable_sync] Whoop reconnect required: ${result['message']}',
            );
          }
        }
      } catch (error, stack) {
        debugPrint('[wearable_sync] $id sync failed: $error\n$stack');
      }
    }),
  );
}
