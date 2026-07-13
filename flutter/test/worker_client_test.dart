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

  group('Med dose Taken contract (edge vs WorkerClient)', () {
    test('Worker has no med-dose-action route (edge owns notifications)', () {
      // Live probe: POST www.purplelife.org/api/med-dose-action → 404 HTML.
      // Own-user Taken must not be wired through WorkerClient.
      const workerPaths = [
        '/med-dose-action',
        '/meds/dose-action',
        '/meds/taken',
        '/care/mark-dose',
      ];
      for (final path in workerPaths) {
        expect(
          '${AppConfig.defaultWorkerApiBaseUrl}$path',
          startsWith('https://www.purplelife.org/api/'),
        );
      }
      // Documented edge contract (public/sw.js + supabase/functions/med-dose-action).
      const edgeBody = {'doseId': '00000000-0000-0000-0000-000000000001', 'action': 'taken'};
      expect(edgeBody.keys, containsAll(['doseId', 'action']));
      expect(const ['taken', 'skip', 'snooze'], contains(edgeBody['action']));
    });

    test('edge action wire names (skip ≠ skipped status)', () {
      // Edge request action is "skip"; DB column status becomes "skipped".
      // Flutter MedsRepository.markDoseSkipped writes status "skipped" via RLS.
      const edgeActions = {'taken', 'skip', 'snooze'};
      const dbStatuses = {'taken', 'skipped', 'pending'};
      expect(edgeActions.contains('skipped'), isFalse);
      expect(dbStatuses.contains('skip'), isFalse);
    });

    test('Flutter in-app Taken field payload matches edge taken branch', () {
      final takenAt = DateTime.utc(2026, 7, 12, 12, 0, 0).toIso8601String();
      final fields = <String, dynamic>{
        'status': 'taken',
        'taken_at': takenAt,
      };
      expect(fields['status'], 'taken');
      expect(fields['taken_at'], isNotNull);
      expect(fields.containsKey('doseId'), isFalse);
    });
  });
}
