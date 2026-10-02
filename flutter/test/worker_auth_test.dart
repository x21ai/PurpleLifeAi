import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:purple_app/core/auth/auth_repository.dart';
import 'package:purple_app/core/config/app_config.dart';
import 'package:purple_app/core/data/purple_query.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  const config = AppConfig(
    supabaseUrl: 'https://auth.purplelife.org',
    supabaseAnonKey: '',
    siteUrl: 'https://www.purplelife.org',
    workerApiBaseUrl: 'https://www.purplelife.org/api',
    dataBackend: AppConfig.dataBackendCloudflare,
  );

  test('password sign-in uses Worker JWT on /api/data/query', () async {
    final seen = <http.Request>[];
    final httpClient = MockClient((request) async {
      seen.add(request);
      if (request.url.path.endsWith('/auth/sign-in')) {
        return http.Response(
          jsonEncode({
            'access_token': 'worker-jwt',
            'token_type': 'bearer',
            'expires_in': 3600,
            'user': {
              'id': 'user-1',
              'email': 'devynrosewalker@gmail.com',
            },
          }),
          200,
        );
      }
      if (request.url.path.endsWith('/data/query')) {
        return http.Response(
          jsonEncode({
            'data': [
              {'id': 'user-1'},
            ],
            'error': null,
          }),
          200,
        );
      }
      return http.Response('not found', 404);
    });

    final repo = AuthRepository(config: config, httpClient: httpClient);
    final response = await repo.signInWithEmail(
      email: 'devynrosewalker@gmail.com',
      password: 'secret',
    );

    expect(response.session?.accessToken, 'worker-jwt');
    expect(repo.accessToken(), completion('worker-jwt'));
    expect(seen.single.url.toString(), 'https://www.purplelife.org/api/auth/sign-in');
    expect(seen.single.headers['content-type'], 'application/json');
    final signInBody = jsonDecode(seen.single.body) as Map<String, dynamic>;
    expect(signInBody['email'], 'devynrosewalker@gmail.com');

    final rows = await repo.client.from('profiles').select('id').eq('id', 'user-1');
    expect(rows.single['id'], 'user-1');
    final query = seen[1];
    expect(query.url.toString(), 'https://www.purplelife.org/api/data/query');
    expect(query.headers['authorization'], 'Bearer worker-jwt');
    final queryBody = jsonDecode(query.body) as Map<String, dynamic>;
    expect(queryBody['table'], 'profiles');
    expect(queryBody['mode'], 'select');
    expect(
      seen.every((request) => request.url.host != 'auth.purplelife.org'),
      isTrue,
    );
  });

  test('invalid Worker credentials surface as AuthException', () async {
    final httpClient = MockClient((request) async {
      return http.Response(jsonEncode({'error': 'Invalid credentials'}), 401);
    });
    final repo = AuthRepository(config: config, httpClient: httpClient);
    expect(
      () => repo.signInWithEmail(email: 'a@b.c', password: 'nope'),
      throwsA(isA<AuthException>()),
    );
  });

  test('parseWorkerOrFilter keeps broadcast and recipient clauses', () {
    final clauses = parseWorkerOrFilter(
      'is_broadcast.eq.true,recipient_id.eq.user-1',
    );
    expect(clauses, [
      {'op': 'eq', 'col': 'is_broadcast', 'val': true},
      {'op': 'eq', 'col': 'recipient_id', 'val': 'user-1'},
    ]);
  });

  test('auth callback recognizes Worker access_token query', () {
    final uri = Uri.parse(
      'org.purplelife.app://auth-callback?access_token=worker-jwt&user_id=user-1',
    );
    expect(AuthRepository.isAuthCallbackUri(uri), isTrue);
  });
}
