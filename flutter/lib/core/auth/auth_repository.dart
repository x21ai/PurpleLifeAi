import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/app_config.dart';
import '../data/purple_client.dart';
import '../data/purple_query.dart';
import 'auth_redirect_uris.dart';

const _secureSessionKey = 'purple.auth.session.v1';
const _workerSessionKey = 'purple.auth.worker.session.v1';

/// Supabase `mailer_otp_exp` for Purple Life (seconds).
const recoveryLinkTtlSeconds = 3600;

/// Human-readable recovery link TTL for user-facing copy.
const recoveryLinkTtlLabel = '1 hour';

/// Result of parsing a recovery or OAuth callback URL.
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

/// Email, OAuth, and session storage.
///
/// `DATA_BACKEND=cloudflare` (the TestFlight default) signs in through
/// `POST /api/auth/sign-in` and stores the Worker HS256 JWT. Supabase GoTrue
/// at `auth.purplelife.org` is used only when `DATA_BACKEND=supabase`.
class AuthRepository {
  AuthRepository({
    required AppConfig config,
    FlutterSecureStorage? secureStorage,
    SupabaseClient? supabaseClient,
    http.Client? httpClient,
  })  : _config = config,
        _secureStorage = secureStorage ?? const FlutterSecureStorage(),
        _http = httpClient ?? http.Client(),
        _supabaseOverride = supabaseClient {
    final supabase = config.usesCloudflareAuth
        ? null
        : (supabaseClient ?? Supabase.instance.client);
    _client = PurpleClient(
      config: config,
      httpClient: _http,
      supabase: supabase,
      readSession: () => currentSession,
      authStates: config.usesCloudflareAuth
          ? _authStates.stream
          : supabase!.auth.onAuthStateChange,
      signOut: signOut,
      signInWithPassword: signInWithEmail,
      updatePassword: _updatePassword,
      adoptCallback: (uri) async {
        final result = await bootstrapRecoveryFromUri(uri);
        return RecoveryBootstrap(ok: result.ok);
      },
    );
    PurpleClient.bind(_client);
  }

  final AppConfig _config;
  final FlutterSecureStorage _secureStorage;
  final http.Client _http;
  final SupabaseClient? _supabaseOverride;
  final StreamController<AuthState> _authStates =
      StreamController<AuthState>.broadcast();

  late final PurpleClient _client;
  Session? _workerSession;

  PurpleClient get client => _client;

  Stream<AuthState> get authStateChanges => _config.usesCloudflareAuth
      ? _authStates.stream
      : _supabase.auth.onAuthStateChange;

  Session? get currentSession =>
      _config.usesCloudflareAuth ? _workerSession : _supabase.auth.currentSession;

  User? get currentUser => currentSession?.user;

  bool get isAuthenticated {
    final session = currentSession;
    return session != null && !session.isExpired;
  }

  SupabaseClient get _supabase =>
      _supabaseOverride ?? Supabase.instance.client;

  /// Initialize auth and restore a saved session.
  static Future<AuthRepository> initialize(AppConfig config) async {
    if (!config.usesCloudflareAuth) {
      await Supabase.initialize(
        url: config.supabaseUrl,
        publishableKey: config.supabaseAnonKey,
        authOptions: const FlutterAuthClientOptions(
          authFlowType: AuthFlowType.pkce,
          autoRefreshToken: true,
        ),
      );
    }

    final repo = AuthRepository(config: config);
    if (config.usesCloudflareAuth) {
      await repo._restoreWorkerSession();
      await repo.ensureValidSession();
      return repo;
    }

    await repo._restoreSecureSession();
    await repo.ensureValidSession();
    repo._supabase.auth.onAuthStateChange.listen((data) {
      unawaited(repo._persistSupabaseSession(data.session));
    });
    return repo;
  }

  /// Refreshes or verifies the saved session.
  ///
  /// Cloudflare JWTs are not refreshable. An expired or rejected token signs
  /// the user out. A still-valid token is kept when verify cannot be reached.
  Future<Session?> ensureValidSession() async {
    if (_config.usesCloudflareAuth) return _ensureWorkerSession();
    return _ensureSupabaseSession();
  }

  /// True when [uri] carries an auth code, token, or error.
  static bool isAuthCallbackUri(Uri uri) {
    if (uri.queryParameters.containsKey('code') ||
        uri.queryParameters.containsKey('access_token') ||
        uri.queryParameters.containsKey('token') ||
        uri.queryParameters.containsKey('error') ||
        uri.queryParameters.containsKey('error_code')) {
      return true;
    }
    final fragment = uri.fragment;
    return fragment.contains('access_token=') ||
        fragment.contains('error=') ||
        fragment.contains('error_code=');
  }

  /// Parses error redirects (expired OTP, denied access).
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

  /// Exchanges a recovery or OAuth callback for a session.
  Future<RecoveryBootstrapResult> bootstrapRecoveryFromUri(Uri uri) async {
    final parsedError = parseAuthCallbackError(uri);
    if (parsedError != null) return parsedError;

    if (!isAuthCallbackUri(uri)) {
      return const RecoveryBootstrapResult(ok: false);
    }

    if (_config.usesCloudflareAuth) {
      return _adoptWorkerCallback(uri);
    }

    try {
      await _supabase.auth.getSessionFromUrl(uri);
      await _persistSupabaseSession(_supabase.auth.currentSession);
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
    if (_config.usesCloudflareAuth) {
      return _workerSignIn(email: email, password: password);
    }
    final response = await _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
    await _persistSupabaseSession(response.session);
    return response;
  }

  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
  }) async {
    if (_config.usesCloudflareAuth) {
      return _workerSignUp(email: email, password: password);
    }
    final response = await _supabase.auth.signUp(
      email: email,
      password: password,
    );
    await _persistSupabaseSession(response.session);
    return response;
  }

  /// Google/Apple OAuth.
  ///
  /// Cloudflare opens `GET /api/auth/oauth/{provider}` and finishes when the
  /// site hands `access_token` back to `org.purplelife.app://auth-callback`.
  Future<bool> signInWithOAuth(OAuthProvider provider) async {
    final redirectTo = AuthRedirectUris.oauthCallback(_config.siteUrl);
    if (_config.usesCloudflareAuth) {
      final start = workerApiUri(
        _config.workerApiBaseUrl,
        '/auth/oauth/${provider.name}',
      ).replace(queryParameters: {'redirect_to': redirectTo});
      return launchUrl(start, mode: LaunchMode.externalApplication);
    }

    if (kIsWeb) {
      return _supabase.auth.signInWithOAuth(
        provider,
        redirectTo: redirectTo,
      );
    }

    final response = await _supabase.auth.getOAuthSignInUrl(
      provider: provider,
      redirectTo: redirectTo,
    );
    return launchUrl(
      Uri.parse(response.url),
      mode: LaunchMode.externalApplication,
    );
  }

  /// Sends a password reset email.
  Future<void> resetPasswordForEmail(String email) {
    if (_config.usesCloudflareAuth) {
      return _workerResetPassword(email);
    }
    return _supabase.auth.resetPasswordForEmail(
      email,
      redirectTo: AuthRedirectUris.passwordReset(_config.siteUrl),
    );
  }

  /// Ends the session and clears secure-storage backup.
  Future<void> signOut() async {
    if (_config.usesCloudflareAuth) {
      _workerSession = null;
      if (!_authStates.isClosed) {
        _authStates.add(AuthState(AuthChangeEvent.signedOut, null));
      }
      await _clearPersistedSession(_workerSessionKey);
      return;
    }
    await _supabase.auth.signOut();
    await _clearPersistedSession(_secureSessionKey);
  }

  Future<String?> accessToken() async {
    if (_config.usesCloudflareAuth) {
      final session = _workerSession;
      if (session == null) return null;
      if (session.isExpired) {
        await signOut();
        return null;
      }
      return session.accessToken;
    }
    final session = currentSession;
    if (session == null) return null;
    if (session.isExpired) {
      final refreshed = await _supabase.auth.refreshSession();
      await _persistSupabaseSession(refreshed.session);
      return refreshed.session?.accessToken;
    }
    return session.accessToken;
  }

  Future<AuthResponse> _workerSignIn({
    required String email,
    required String password,
  }) async {
    final data = await _postAuth('sign-in', {
      'email': email,
      'password': password,
    });
    final session = await _adoptWorkerPayload(data);
    return AuthResponse(session: session, user: session.user);
  }

  Future<AuthResponse> _workerSignUp({
    required String email,
    required String password,
  }) async {
    final data = await _postAuth('sign-up', {
      'email': email,
      'password': password,
    });
    final session = await _adoptWorkerPayload(data);
    return AuthResponse(session: session, user: session.user);
  }

  Future<void> _workerResetPassword(String email) async {
    await _postAuth('reset-request', {
      'email': email,
      'redirectTo': AuthRedirectUris.passwordReset(_config.siteUrl),
    });
  }

  Future<void> _updatePassword(String password) async {
    if (!_config.usesCloudflareAuth) {
      await _supabase.auth.updateUser(UserAttributes(password: password));
      return;
    }
    final token = _workerSession?.accessToken;
    if (token == null || token.isEmpty) {
      throw const AuthException('Not signed in');
    }
    await _postAuth(
      'update-password',
      {'password': password},
      bearer: token,
    );
    if (!_authStates.isClosed && _workerSession != null) {
      _authStates.add(AuthState(AuthChangeEvent.userUpdated, _workerSession));
    }
  }

  Future<Session?> _ensureWorkerSession() async {
    final session = _workerSession;
    if (session == null) return null;
    if (session.isExpired) {
      await signOut();
      return null;
    }
    try {
      final response = await _http.get(
        workerApiUri(_config.workerApiBaseUrl, '/auth/verify'),
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
          'Accept': 'application/json',
        },
      );
      if (response.statusCode == 401) {
        await signOut();
        return null;
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return session;
      }
      return session;
    } catch (error, stack) {
      debugPrint('[AuthRepository] verify failed: $error\n$stack');
      return session;
    }
  }

  Future<Session?> _ensureSupabaseSession() async {
    var session = currentSession;
    if (session == null) return null;
    final hadSession = session;

    try {
      if (session.isExpired) {
        final response = await _supabase.auth.refreshSession();
        session = response.session;
        if (session == null) {
          await signOut();
          return null;
        }
        await _persistSupabaseSession(session);
      }

      final userResponse = await _supabase.auth.getUser();
      if (userResponse.user == null) {
        await signOut();
        return null;
      }
      return session;
    } on AuthException catch (error, stack) {
      debugPrint(
        '[AuthRepository] ensureValidSession auth error: ${error.message}\n$stack',
      );
      await signOut();
      return null;
    } catch (error, stack) {
      debugPrint('[AuthRepository] ensureValidSession failed: $error\n$stack');
      if (hadSession.isExpired) {
        await signOut();
        return null;
      }
      return hadSession;
    }
  }

  Future<RecoveryBootstrapResult> _adoptWorkerCallback(Uri uri) async {
    final params = <String, String>{...uri.queryParameters};
    if (uri.fragment.isNotEmpty) {
      params.addAll(
        Uri.splitQueryString(
          uri.fragment.startsWith('#') ? uri.fragment.substring(1) : uri.fragment,
        ),
      );
    }
    final token = params['access_token'] ?? params['token'];
    if (token == null || token.isEmpty) {
      return const RecoveryBootstrapResult(ok: false);
    }
    try {
      await _adoptWorkerPayload({
        'access_token': token,
        'expires_in': int.tryParse(params['expires_in'] ?? ''),
        'user': {
          'id': params['user_id'] ?? jwtClaim(token, 'sub'),
          'email': params['email'] ?? jwtClaim(token, 'email'),
        },
      });
      if (!_authStates.isClosed) {
        _authStates.add(
          AuthState(AuthChangeEvent.signedIn, _workerSession),
        );
      }
      return const RecoveryBootstrapResult(ok: true);
    } on AuthException catch (error) {
      return RecoveryBootstrapResult(ok: false, message: error.message);
    }
  }

  Future<Session> _adoptWorkerPayload(Map<String, dynamic> data) async {
    final token = data['access_token'];
    if (token is! String || token.isEmpty) {
      throw const AuthException('Sign-in did not return a session.');
    }
    final userRaw = data['user'];
    final userMap = userRaw is Map
        ? Map<String, dynamic>.from(userRaw)
        : <String, dynamic>{};
    final userId = userMap['id']?.toString() ?? jwtClaim(token, 'sub');
    if (userId == null || userId.isEmpty) {
      throw const AuthException('Sign-in did not return a user.');
    }
    final email = userMap['email']?.toString() ?? jwtClaim(token, 'email');
    final expiresIn = _expiresInSeconds(data['expires_in'], token);
    final user = User(
      id: userId,
      appMetadata: const {},
      userMetadata: const {},
      aud: 'authenticated',
      email: email,
      createdAt: DateTime.now().toUtc().toIso8601String(),
    );
    final session = Session(
      accessToken: token,
      tokenType: 'bearer',
      expiresIn: expiresIn,
      user: user,
    );
    _workerSession = session;
    await _persistWorkerSession(session);
    if (!_authStates.isClosed) {
      _authStates.add(AuthState(AuthChangeEvent.signedIn, session));
    }
    return session;
  }

  Future<Map<String, dynamic>> _postAuth(
    String path,
    Map<String, dynamic> body, {
    String? bearer,
  }) async {
    final uri = workerApiUri(_config.workerApiBaseUrl, '/auth/$path');
    http.Response response;
    try {
      response = await _http.post(
        uri,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          if (bearer != null && bearer.isNotEmpty) 'Authorization': 'Bearer $bearer',
        },
        body: jsonEncode(body),
      );
    } catch (error) {
      throw AuthException('Network error. ${error.toString()}');
    }
    Map<String, dynamic> decoded = {};
    if (response.body.isNotEmpty) {
      try {
        final raw = jsonDecode(response.body);
        if (raw is Map) decoded = Map<String, dynamic>.from(raw);
      } catch (_) {
        decoded = {};
      }
    }
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }
    final message = decoded['error']?.toString() ?? 'Sign-in failed';
    final lower = message.toLowerCase();
    if (response.statusCode == 409 || lower.contains('already')) {
      throw AuthException(message, statusCode: '${response.statusCode}', code: 'user_already_exists');
    }
    if (lower.contains('at least 8')) {
      throw AuthException(message, statusCode: '${response.statusCode}', code: 'weak_password');
    }
    if (response.statusCode == 401 || lower.contains('invalid credentials')) {
      throw AuthException(
        'Invalid login credentials',
        statusCode: '${response.statusCode}',
        code: 'invalid_credentials',
      );
    }
    throw AuthException(message, statusCode: '${response.statusCode}');
  }

  int _expiresInSeconds(Object? raw, String token) {
    if (raw is int && raw > 0) return raw;
    if (raw is num && raw > 0) return raw.toInt();
    final exp = jwtExpiryUnix(token);
    if (exp == null) return 3600;
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final delta = exp - now;
    return delta > 0 ? delta : 1;
  }

  Future<void> _persistWorkerSession(Session session) async {
    if (kIsWeb) return;
    final exp = jwtExpiryUnix(session.accessToken);
    try {
      await _secureStorage.write(
        key: _workerSessionKey,
        value: jsonEncode({
          'access_token': session.accessToken,
          'expires_at': exp,
          'user_id': session.user.id,
          'email': session.user.email,
        }),
      );
    } catch (error, stack) {
      debugPrint('[AuthRepository] secure session write failed: $error\n$stack');
    }
  }

  Future<void> _restoreWorkerSession() async {
    if (kIsWeb) return;
    try {
      final raw = await _secureStorage.read(key: _workerSessionKey);
      if (raw == null || raw.isEmpty) return;
      final decoded = jsonDecode(raw);
      if (decoded is! Map) return;
      final token = decoded['access_token']?.toString();
      final userId = decoded['user_id']?.toString();
      if (token == null || token.isEmpty || userId == null || userId.isEmpty) {
        await _clearPersistedSession(_workerSessionKey);
        return;
      }
      final exp = decoded['expires_at'];
      if (exp is int) {
        final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
        if (exp <= now) {
          await _clearPersistedSession(_workerSessionKey);
          return;
        }
      }
      await _adoptWorkerPayload({
        'access_token': token,
        'user': {
          'id': userId,
          'email': decoded['email'],
        },
      });
    } catch (error, stack) {
      debugPrint('[AuthRepository] secure session restore failed: $error\n$stack');
      await _clearPersistedSession(_workerSessionKey);
    }
  }

  Future<void> _persistSupabaseSession(Session? session) async {
    if (kIsWeb) return;
    if (session == null) {
      await _clearPersistedSession(_secureSessionKey);
      return;
    }
    try {
      await _secureStorage.write(
        key: _secureSessionKey,
        value: jsonEncode(session.toJson()),
      );
    } catch (error, stack) {
      debugPrint('[AuthRepository] secure session write failed: $error\n$stack');
    }
  }

  Future<void> _restoreSecureSession() async {
    if (kIsWeb) return;
    try {
      final raw = await _secureStorage.read(key: _secureSessionKey);
      if (raw == null || raw.isEmpty) return;
      await _supabase.auth.recoverSession(raw);
    } catch (error, stack) {
      debugPrint('[AuthRepository] secure session restore failed: $error\n$stack');
      await _clearPersistedSession(_secureSessionKey);
    }
  }

  Future<void> _clearPersistedSession(String key) async {
    try {
      await _secureStorage.delete(key: key);
    } catch (error, stack) {
      debugPrint('[AuthRepository] secure session clear failed: $error\n$stack');
    }
  }
}

/// Reads a string claim from a JWT payload without verifying the signature.
String? jwtClaim(String token, String key) {
  final payload = _jwtPayload(token);
  final value = payload?[key];
  if (value == null) return null;
  return value.toString();
}

/// `exp` unix seconds from an unverified JWT payload.
int? jwtExpiryUnix(String token) {
  final payload = _jwtPayload(token);
  final exp = payload?['exp'];
  if (exp is int) return exp;
  if (exp is num) return exp.toInt();
  return null;
}

Map<String, dynamic>? _jwtPayload(String token) {
  final parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    final normalized = base64Url.normalize(parts[1]);
    final decoded = utf8.decode(base64Url.decode(normalized));
    final raw = jsonDecode(decoded);
    if (raw is Map) return Map<String, dynamic>.from(raw);
  } catch (_) {
    return null;
  }
  return null;
}
