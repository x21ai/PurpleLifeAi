import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/config/app_config.dart';

void main() {
  group('WorkerClient Whoop API contract', () {
    test('whoop-config URL matches Worker route', () {
      expect(
        '${AppConfig.defaultWorkerApiBaseUrl}/health/whoop-config',
        'https://www.purplelife.org/api/health/whoop-config',
      );
    });

    test('whoop-exchange URL matches Worker route', () {
      expect(
        '${AppConfig.defaultWorkerApiBaseUrl}/health/whoop-exchange',
        'https://www.purplelife.org/api/health/whoop-exchange',
      );
    });

    test('whoop-sync URL matches Worker route', () {
      expect(
        '${AppConfig.defaultWorkerApiBaseUrl}/health/whoop-sync',
        'https://www.purplelife.org/api/health/whoop-sync',
      );
    });

    test('exchange POST body keys match whoop-exchange.ts', () {
      const body = {
        'code': 'auth-code',
        'redirect_uri': 'org.purplelife.app://oauth-whoop-callback',
      };
      expect(body.keys, containsAll(['code', 'redirect_uri']));
    });
  });
}
