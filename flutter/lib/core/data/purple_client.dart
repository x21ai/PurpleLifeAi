import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';
import 'purple_query.dart';

/// App data client.
///
/// When [supabase] is null, table queries, storage, and edge invokes use the
/// Cloudflare Worker and the Worker JWT from [readSession]. The Supabase
/// client is only used when `DATA_BACKEND=supabase`.
class PurpleClient {
  PurpleClient({
    required AppConfig config,
    required http.Client httpClient,
    required Session? Function() readSession,
    required Stream<AuthState> authStates,
    required Future<void> Function() signOut,
    required Future<AuthResponse> Function({
      required String email,
      required String password,
    }) signInWithPassword,
    required Future<void> Function(String password) updatePassword,
    required Future<RecoveryBootstrap> Function(Uri uri) adoptCallback,
    Future<String?> Function()? resolveAccessToken,
    SupabaseClient? supabase,
  })  : _config = config,
        _http = httpClient,
        _readSession = readSession,
        _authStates = authStates,
        _signOut = signOut,
        _signInWithPassword = signInWithPassword,
        _updatePassword = updatePassword,
        _adoptCallback = adoptCallback,
        _resolveAccessToken = resolveAccessToken,
        _supabase = supabase {
    auth = PurpleAuth(this);
    storage = PurpleStorage(this);
    functions = PurpleFunctions(this);
  }

  static PurpleClient? _current;

  static PurpleClient? maybeOf() => _current;

  static PurpleClient get current {
    final client = _current;
    if (client == null) {
      throw StateError('PurpleClient is not initialized');
    }
    return client;
  }

  static void bind(PurpleClient client) {
    _current = client;
  }

  final AppConfig _config;
  final http.Client _http;
  final Session? Function() _readSession;
  final Stream<AuthState> _authStates;
  final Future<void> Function() _signOut;
  final Future<AuthResponse> Function({
    required String email,
    required String password,
  }) _signInWithPassword;
  final Future<void> Function(String password) _updatePassword;
  final Future<RecoveryBootstrap> Function(Uri uri) _adoptCallback;
  final Future<String?> Function()? _resolveAccessToken;
  final SupabaseClient? _supabase;

  late final PurpleAuth auth;
  late final PurpleStorage storage;
  late final PurpleFunctions functions;

  bool get usesCloudflare => _supabase == null;

  Future<T> rpc<T>(String fn, {Map<String, dynamic>? params}) async {
    final supabase = _supabase;
    if (supabase != null) {
      return supabase.rpc<T>(fn, params: params);
    }
    final token = await _accessToken();
    if (token == null || token.isEmpty) {
      throw const PostgrestException(message: 'Not signed in');
    }
    final response = await _http.post(
      workerApiUri(_config.workerApiBaseUrl, '/data/rpc'),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'fn': fn, 'args': params ?? <String, dynamic>{}}),
    );
    Map<String, dynamic> decoded = {};
    if (response.body.isNotEmpty) {
      final raw = jsonDecode(response.body);
      if (raw is Map) decoded = Map<String, dynamic>.from(raw);
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw PostgrestException(
        message: decoded['error']?.toString() ?? 'RPC failed',
        code: '${response.statusCode}',
      );
    }
    return decoded['data'] as T;
  }

  PurpleQuery from(String table) {
    final supabase = _supabase;
    if (supabase != null) {
      return PurpleQuery.supabase(supabase.from(table));
    }
    return PurpleQuery.cloudflare(
      config: _config,
      httpClient: _http,
      token: _accessToken,
      table: table,
    );
  }

  PurpleChannel channel(String name) {
    final supabase = _supabase;
    if (supabase != null) {
      return PurpleChannel._(supabase.channel(name));
    }
    return PurpleChannel.cloudflare(poll: _pollCareMessages);
  }

  void removeChannel(PurpleChannel channel) {
    channel.dispose();
    final raw = channel._raw;
    final supabase = _supabase;
    if (raw != null && supabase != null) {
      supabase.removeChannel(raw);
    }
  }

  Future<List<Map<String, dynamic>>> _pollCareMessages({
    required String threadId,
    required String? since,
  }) async {
    final token = await _accessToken();
    if (token == null || token.isEmpty) return const [];
    final response = await _http.post(
      workerApiUri(_config.workerApiBaseUrl, '/realtime/care-messages'),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'threadId': threadId,
        if (since != null) 'since': since,
      }),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return const [];
    }
    if (response.body.isEmpty) return const [];
    final raw = jsonDecode(response.body);
    if (raw is! Map) return const [];
    final messages = raw['messages'];
    if (messages is! List) return const [];
    return [
      for (final row in messages)
        if (row is Map) Map<String, dynamic>.from(row),
    ];
  }

  Future<String?> _accessToken() async {
    final resolver = _resolveAccessToken;
    if (resolver != null) return resolver();
    final session = _readSession();
    if (session == null || session.isExpired) return null;
    return session.accessToken;
  }
}

/// Result of adopting an OAuth or recovery callback. Kept tiny so the data
/// client does not depend on the auth repository type.
class RecoveryBootstrap {
  const RecoveryBootstrap({required this.ok});

  final bool ok;
}

class PurpleAuth {
  PurpleAuth(this._client);

  final PurpleClient _client;

  late final PurpleMfa mfa = PurpleMfa(_client);

  Session? get currentSession => _client._readSession();

  User? get currentUser => currentSession?.user;

  Stream<AuthState> get onAuthStateChange => _client._authStates;

  Future<void> signOut() => _client._signOut();

  Future<AuthResponse> signInWithPassword({
    required String email,
    required String password,
  }) {
    return _client._signInWithPassword(email: email, password: password);
  }

  Future<void> updateUser(UserAttributes attributes) async {
    final password = attributes.password;
    if (password == null || password.isEmpty) {
      throw const AuthException('Password required');
    }
    await _client._updatePassword(password);
  }

  Future<void> getSessionFromUrl(Uri uri) async {
    final result = await _client._adoptCallback(uri);
    if (!result.ok) {
      throw const AuthException('Could not complete sign-in from that link.');
    }
  }
}

class PurpleMfa {
  PurpleMfa(this._client);

  final PurpleClient _client;

  Future<AuthMFAListFactorsResponse> listFactors() async {
    final supabase = _client._supabase;
    if (supabase != null) return supabase.auth.mfa.listFactors();
    return const AuthMFAListFactorsResponse(
      all: [],
      totp: [],
      phone: [],
    );
  }

  Future<AuthMFAUnenrollResponse> unenroll(String factorId) async {
    final supabase = _client._supabase;
    if (supabase != null) {
      return supabase.auth.mfa.unenroll(factorId);
    }
    return AuthMFAUnenrollResponse(id: factorId);
  }

  Future<AuthMFAEnrollResponse> enroll({
    required FactorType factorType,
    String? issuer,
  }) async {
    final supabase = _client._supabase;
    if (supabase != null) {
      return supabase.auth.mfa.enroll(
        factorType: factorType,
        issuer: issuer,
      );
    }
    throw const AuthException(
      'Two-factor is not available with this sign-in yet.',
    );
  }

  Future<AuthMFAChallengeResponse> challenge({required String factorId}) async {
    final supabase = _client._supabase;
    if (supabase != null) {
      return supabase.auth.mfa.challenge(factorId: factorId);
    }
    throw const AuthException(
      'Two-factor is not available with this sign-in yet.',
    );
  }

  Future<AuthMFAVerifyResponse> verify({
    required String factorId,
    required String challengeId,
    required String code,
  }) async {
    final supabase = _client._supabase;
    if (supabase != null) {
      return supabase.auth.mfa.verify(
        factorId: factorId,
        challengeId: challengeId,
        code: code,
      );
    }
    throw const AuthException(
      'Two-factor is not available with this sign-in yet.',
    );
  }
}

class PurpleStorage {
  PurpleStorage(this._client);

  final PurpleClient _client;

  PurpleBucket from(String bucket) => PurpleBucket(_client, bucket);
}

class PurpleBucket {
  PurpleBucket(this._client, this._bucket);

  final PurpleClient _client;
  final String _bucket;

  Future<String> uploadBinary(
    String path,
    Uint8List bytes, {
    FileOptions? fileOptions,
  }) async {
    final supabase = _client._supabase;
    if (supabase != null) {
      return supabase.storage.from(_bucket).uploadBinary(
            path,
            bytes,
            fileOptions: fileOptions ?? const FileOptions(),
          );
    }
    final token = await _client._accessToken();
    if (token == null || token.isEmpty) {
      throw const StorageException('Not signed in');
    }
    final request = http.MultipartRequest(
      'POST',
      workerApiUri(_client._config.workerApiBaseUrl, '/storage/upload'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    request.fields['bucket'] = _bucket;
    request.fields['path'] = path;
    final contentType = fileOptions?.contentType;
    if (contentType != null && contentType.isNotEmpty) {
      request.fields['contentType'] = contentType;
    }
    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: path.split('/').last,
      ),
    );
    final streamed = await _client._http.send(request);
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StorageException(
        'Upload failed (${response.statusCode})',
        statusCode: response.statusCode.toString(),
      );
    }
    return path;
  }

  Future<String> createSignedUrl(String path, int expiresIn) async {
    final supabase = _client._supabase;
    if (supabase != null) {
      return supabase.storage.from(_bucket).createSignedUrl(path, expiresIn);
    }
    final token = await _client._accessToken();
    if (token == null || token.isEmpty) {
      throw const StorageException('Not signed in');
    }
    return workerApiUri(_client._config.workerApiBaseUrl, '/storage/object')
        .replace(
          queryParameters: {
            'bucket': _bucket,
            'path': path,
            'token': token,
          },
        )
        .toString();
  }

  Future<List<dynamic>> remove(List<String> paths) async {
    final supabase = _client._supabase;
    if (supabase != null) {
      return supabase.storage.from(_bucket).remove(paths);
    }
    // Worker storage has upload and read. Delete is a no-op until a route exists.
    return const [];
  }
}

class PurpleFunctions {
  PurpleFunctions(this._client);

  final PurpleClient _client;

  Future<PurpleInvokeResponse> invoke(
    String name, {
    Map<String, dynamic>? body,
  }) async {
    final supabase = _client._supabase;
    if (supabase != null) {
      final response = await supabase.functions.invoke(name, body: body);
      return PurpleInvokeResponse(status: response.status, data: response.data);
    }
    final token = await _client._accessToken();
    final response = await _client._http.post(
      workerApiUri(
        _client._config.workerApiBaseUrl,
        '/cloudflare/edge/invoke',
      ),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'name': name, ...?body}),
    );
    Object? data;
    if (response.body.isNotEmpty) {
      try {
        data = jsonDecode(response.body);
      } catch (_) {
        data = response.body;
      }
    }
    return PurpleInvokeResponse(status: response.statusCode, data: data);
  }
}

class PurpleInvokeResponse {
  const PurpleInvokeResponse({required this.status, this.data});

  final int status;
  final Object? data;
}

typedef CarePoll = Future<List<Map<String, dynamic>>> Function({
  required String threadId,
  required String? since,
});

class PurpleChannel {
  PurpleChannel._(this._raw, {CarePoll? poll}) : _poll = poll;

  PurpleChannel.cloudflare({required CarePoll poll}) : this._(null, poll: poll);

  final RealtimeChannel? _raw;
  final CarePoll? _poll;
  Timer? _timer;
  String? _since;

  /// Poll care-message inserts newer than subscribe time. Cloudflare has no
  /// Postgres realtime channel.
  void pollCareInserts({
    required String threadId,
    required void Function(Map<String, dynamic> record) onInsert,
  }) {
    final poll = _poll;
    if (poll == null) return;
    _since = DateTime.now().toUtc().toIso8601String();
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 2), (_) async {
      try {
        final rows = await poll(threadId: threadId, since: _since);
        for (final row in rows) {
          final created = row['created_at']?.toString();
          if (created != null &&
              (_since == null || created.compareTo(_since!) > 0)) {
            _since = created;
          }
          onInsert(row);
        }
      } catch (_) {
        // The next tick retries. A failed poll is not a reload.
      }
    });
  }

  void dispose() {
    _timer?.cancel();
    _timer = null;
  }

  PurpleChannel onPostgresChanges({
    required PostgresChangeEvent event,
    required String schema,
    required String table,
    PostgresChangeFilter? filter,
    required void Function(PostgresChangePayload payload) callback,
  }) {
    final raw = _raw;
    if (raw != null) {
      raw.onPostgresChanges(
        event: event,
        schema: schema,
        table: table,
        filter: filter,
        callback: callback,
      );
    }
    return this;
  }

  PurpleChannel subscribe() {
    _raw?.subscribe();
    return this;
  }
}
