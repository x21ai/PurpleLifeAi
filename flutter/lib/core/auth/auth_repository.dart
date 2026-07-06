import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';
import 'auth_redirect_uris.dart';

const _secureSessionKey = 'purple.auth.session.v1';

/// Supabase `mailer_otp_exp` for Purple Life (seconds).
const recoveryLinkTtlSeconds = 3600;

/// Human-readable recovery link TTL for user-facing copy.
const recoveryLinkTtlLabel = '1 hour';

/// Result of parsing a Supabase recovery or OAuth callback URL.
class RecoveryBootstrapResult {
  const RecoveryBootstrapResult({
    required this.ok,
    this.expired = false,
    this.message,
  });

  final bool ok;
  final bool expired;
  final String? message;
}

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
    repo._client.auth.onAuthStateChange.listen((data) {
      unawaited(repo._persistSession(data.session));
    });
    return repo;
  }

  /// True when [uri] carries a Supabase PKCE `code` or implicit recovery token.
  static bool isAuthCallbackUri(Uri uri) {
    if (uri.queryParameters.containsKey('code') ||
        uri.queryParameters.containsKey('error') ||
        uri.queryParameters.containsKey('error_code')) {
      return true;
    }
    final fragment = uri.fragment;
    return fragment.contains('access_token=') ||
        fragment.contains('error=') ||
        fragment.contains('error_code=');
  }

  /// Parses Supabase error redirects (expired OTP, denied access).
  static RecoveryBootstrapResult? parseAuthCallbackError(Uri uri) {
    String? errorCode = uri.queryParameters['error_code'];
    String? errorDescription = uri.queryParameters['error_description'];
    if (errorCode == null && errorDescription == null && uri.fragment.isNotEmpty) {
      final hashParams = Uri.splitQueryString(
        uri.fragment.startsWith('#') ? uri.fragment.substring(1) : uri.fragment,
      );
      errorCode = hashParams['error_code'];
      errorDescription = hashParams['error_description'];
    }
    if (errorCode == null && errorDescription == null) return null;
    return RecoveryBootstrapResult(
      ok: false,
      expired: errorCode == 'otp_expired' || errorCode == 'access_denied',
      message: errorDescription?.replaceAll('+', ' '),
    );
  }

  /// Exchanges a recovery deep link or web URL for a Supabase session (PKCE).
  ///
  /// Mirrors web `bootstrapRecoverySessionFromUrl` (`src/lib/auth-recovery.ts`).
  Future<RecoveryBootstrapResult> bootstrapRecoveryFromUri(Uri uri) async {
    final parsedError = parseAuthCallbackError(uri);
    if (parsedError != null) return parsedError;

    if (!isAuthCallbackUri(uri)) {
      return const RecoveryBootstrapResult(ok: false);
    }

    try {
      await _client.auth.getSessionFromUrl(uri);
      await _persistSession(_client.auth.currentSession);
      return const RecoveryBootstrapResult(ok: true);
    } catch (error) {
      final message = error is AuthException ? error.message : error.toString();
      return RecoveryBootstrapResult(
        ok: false,
        expired: RegExp(r'expired|invalid', caseSensitive: false).hasMatch(message),
        message: message,
      );
    }
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

  /// Sends a password reset email (mirrors web `sign-in.tsx` `handleForgotPassword`).
  ///
  /// Native opens `org.purplelife.app://reset-password`; web uses `/reset-password`.
  Future<void> resetPasswordForEmail(String email) {
    return _client.auth.resetPasswordForEmail(
      email,
      redirectTo: AuthRedirectUris.passwordReset(_config.siteUrl),
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
