import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

const _secureSessionKey = 'purple.auth.session.v1';

/// Supabase auth with secure session backup (mirrors web persistSession behavior).
class AuthRepository {
  AuthRepository({
    required AppConfig config,
    FlutterSecureStorage? secureStorage,
    SupabaseClient? client,
  })  : _config = config,
        _secureStorage = secureStorage ?? const FlutterSecureStorage(),
        _client = client ?? Supabase.instance.client;

  final AppConfig _config;
  final FlutterSecureStorage _secureStorage;
  final SupabaseClient _client;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Session? get currentSession => _client.auth.currentSession;

  User? get currentUser => _client.auth.currentUser;

  bool get isAuthenticated => currentSession != null;

  /// Initialize Supabase and restore any secure-storage session backup.
  static Future<AuthRepository> initialize(AppConfig config) async {
    await Supabase.initialize(
      url: config.supabaseUrl,
      publishableKey: config.supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
        autoRefreshToken: true,
      ),
    );

    final repo = AuthRepository(config: config);
    await repo._restoreSecureSession();
    return repo;
  }

  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final response = await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
    await _persistSession(response.session);
    return response;
  }

  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
  }) async {
    final response = await _client.auth.signUp(
      email: email,
      password: password,
    );
    await _persistSession(response.session);
    return response;
  }

  Future<bool> signInWithOAuth(OAuthProvider provider) async {
    final redirectTo = '${_config.siteUrl}/auth/callback';
    return _client.auth.signInWithOAuth(
      provider,
      redirectTo: redirectTo,
      authScreenLaunchMode: LaunchMode.externalApplication,
    );
  }

  /// Ends the Supabase session and clears secure-storage backup.
  ///
  /// UI should call [signOutSessionProvider] instead so offline cache and
  /// Riverpod data providers are cleared for the active user first.
  Future<void> signOut() async {
    await _client.auth.signOut();
    await _clearPersistedSession();
  }

  Future<String?> accessToken() async {
    final session = currentSession;
    if (session == null) return null;
    if (session.isExpired) {
      final refreshed = await _client.auth.refreshSession();
      await _persistSession(refreshed.session);
      return refreshed.session?.accessToken;
    }
    return session.accessToken;
  }

  Future<void> _persistSession(Session? session) async {
    // Web already persists Supabase sessions in browser storage.
    if (kIsWeb) return;
    if (session == null) {
      await _clearPersistedSession();
      return;
    }
    try {
      await _secureStorage.write(
        key: _secureSessionKey,
        value: jsonEncode(session.toJson()),
      );
    } catch (e, st) {
      debugPrint('[AuthRepository] secure session write failed: $e\n$st');
    }
  }

  Future<void> _restoreSecureSession() async {
    if (kIsWeb) return;
    try {
      final raw = await _secureStorage.read(key: _secureSessionKey);
      if (raw == null || raw.isEmpty) return;
      await _client.auth.recoverSession(raw);
    } catch (e, st) {
      debugPrint('[AuthRepository] secure session restore failed: $e\n$st');
      await _clearPersistedSession();
    }
  }

  Future<void> _clearPersistedSession() async {
    try {
      await _secureStorage.delete(key: _secureSessionKey);
    } catch (e, st) {
      debugPrint('[AuthRepository] secure session clear failed: $e\n$st');
    }
  }
}
