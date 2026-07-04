import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../api/worker_client.dart';
import '../auth/auth_repository.dart';
import '../config/app_config.dart';
import '../network/connectivity_service.dart';
import '../offline/database.dart';
import '../offline/sync_service.dart';

/// Compile-time config (requires SUPABASE_ANON_KEY dart-define at run/build).
final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.fromEnvironment();
});

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

final authRepositoryProvider = FutureProvider<AuthRepository>((ref) async {
  final config = ref.watch(appConfigProvider);
  return AuthRepository.initialize(config);
});

final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  ref.watch(authRepositoryProvider).requireValue;
  return Supabase.instance.client;
});

final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  final config = ref.watch(appConfigProvider);
  final service = ConnectivityService(config: config);
  ref.onDispose(service.dispose);
  unawaited(service.start());
  return service;
});

final workerClientProvider = Provider<WorkerClient>((ref) {
  final config = ref.watch(appConfigProvider);
  final auth = ref.watch(authRepositoryProvider).valueOrNull;
  if (auth == null) {
    throw StateError('WorkerClient requires initialized AuthRepository');
  }
  final client = WorkerClient(config: config, authRepository: auth);
  ref.onDispose(client.dispose);
  return client;
});

final syncServiceProvider = Provider<SyncService>((ref) {
  final db = ref.watch(appDatabaseProvider);
  final auth = ref.watch(authRepositoryProvider).valueOrNull;
  if (auth == null) {
    throw StateError('SyncService requires initialized AuthRepository');
  }
  final connectivity = ref.watch(connectivityServiceProvider);
  final worker = ref.watch(workerClientProvider);
  final service = SyncService(
    database: db,
    authRepository: auth,
    connectivityService: connectivity,
    workerClient: worker,
    supabaseClient: ref.watch(supabaseClientProvider),
  );
  unawaited(service.start());
  return service;
});

final isOnlineProvider = StreamProvider<bool>((ref) {
  final connectivity = ref.watch(connectivityServiceProvider);
  return connectivity.onlineStream;
});

final authSessionProvider = StreamProvider<Session?>((ref) async* {
  final auth = await ref.watch(authRepositoryProvider.future);
  yield auth.currentSession;
  await for (final state in auth.authStateChanges) {
    yield state.session;
  }
});

final cachedBiometricsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final sync = ref.watch(syncServiceProvider);
  return sync.readCached(tableName: SyncTables.biometrics);
});

final cachedMedicationsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final sync = ref.watch(syncServiceProvider);
  return sync.readCached(tableName: SyncTables.medications);
});

final cachedDosesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final sync = ref.watch(syncServiceProvider);
  return sync.readCached(tableName: SyncTables.medicationDoses);
});

final cachedJournalProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final sync = ref.watch(syncServiceProvider);
  return sync.readCached(tableName: SyncTables.journalEntries);
});
