import 'dart:convert';

import 'package:http/http.dart' as http;

import '../auth/auth_repository.dart';
import '../config/app_config.dart';

/// Authenticated HTTP client for Cloudflare Worker routes on www.purplelife.org.
class WorkerClient {
  WorkerClient({
    required AppConfig config,
    required AuthRepository authRepository,
    http.Client? httpClient,
  })  : _config = config,
        _auth = authRepository,
        _http = httpClient ?? http.Client();

  final AppConfig _config;
  final AuthRepository _auth;
  final http.Client _http;

  Uri _uri(String path) => Uri.parse('${_config.workerApiBaseUrl}$path');

  Future<Map<String, String>> _authHeaders() async {
    final token = await _auth.accessToken();
    if (token == null || token.isEmpty) {
      throw StateError('Worker API requires authenticated session');
    }
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /// POST /api/health/native-sync (HealthKit / Health Connect batch ingest).
  Future<Map<String, dynamic>> postNativeHealthSync({
    required String source,
    required List<Map<String, dynamic>> samples,
  }) async {
    final headers = await _authHeaders();
    final body = jsonEncode({
      'source': source,
      'samples': samples,
    });

    final response = await _http.post(
      _uri('/health/native-sync'),
      headers: headers,
      body: body,
    );

    return _decodeResponse(response);
  }

  /// POST /api/chat (streaming AI). Returns raw bytes for caller to decode stream.
  Future<http.StreamedResponse> postChatStream({
    required List<Map<String, dynamic>> messages,
  }) async {
    final token = await _auth.accessToken();
    if (token == null || token.isEmpty) {
      throw StateError('Chat API requires authenticated session');
    }

    final request = http.Request('POST', _uri('/chat'))
      ..headers['Authorization'] = 'Bearer $token'
      ..headers['Content-Type'] = 'application/json'
      ..headers['Accept'] = 'text/event-stream'
      ..body = jsonEncode({'messages': messages});

    return _http.send(request);
  }

  /// POST /api/chat (non-streaming helper for simple clients).
  Future<String> postChat({
    required List<Map<String, dynamic>> messages,
  }) async {
    final streamed = await postChatStream(messages: messages);
    final buffer = StringBuffer();
    await for (final chunk in streamed.stream.transform(utf8.decoder)) {
      buffer.write(chunk);
    }
    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw WorkerApiException(streamed.statusCode, buffer.toString());
    }
    return buffer.toString();
  }

  Map<String, dynamic> _decodeResponse(http.Response response) {
    final body = response.body.isEmpty ? '{}' : response.body;
    Map<String, dynamic> decoded;
    try {
      decoded = jsonDecode(body) as Map<String, dynamic>;
    } catch (_) {
      decoded = {'raw': body};
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded['error'] as String? ?? body;
      throw WorkerApiException(response.statusCode, message);
    }
    return decoded;
  }

  void dispose() => _http.close();
}

class WorkerApiException implements Exception {
  const WorkerApiException(this.statusCode, this.message);

  final int statusCode;
  final String message;

  @override
  String toString() => 'WorkerApiException($statusCode): $message';
}
