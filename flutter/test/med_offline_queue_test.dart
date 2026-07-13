import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/offline/sync_service.dart';

void main() {
  group('mergeCachedPayload', () {
    test('returns incoming when no existing row', () {
      final merged = mergeCachedPayload(null, {
        'id': 'd1',
        'status': 'taken',
        'user_id': 'u1',
      });
      expect(merged['status'], 'taken');
      expect(merged['id'], 'd1');
    });

    test('preserves medication_id and scheduled_at on partial Taken update', () {
      final existing = {
        'id': 'd1',
        'user_id': 'u1',
        'medication_id': 'm1',
        'scheduled_at': '2026-07-12T12:00:00.000Z',
        'status': 'pending',
        'amount': 1,
      };
      final merged = mergeCachedPayload(existing, {
        'id': 'd1',
        'user_id': 'u1',
        'status': 'taken',
        'taken_at': '2026-07-12T12:05:00.000Z',
      });
      expect(merged['status'], 'taken');
      expect(merged['medication_id'], 'm1');
      expect(merged['scheduled_at'], '2026-07-12T12:00:00.000Z');
      expect(merged['taken_at'], '2026-07-12T12:05:00.000Z');
      expect(merged['amount'], 1);
    });

    test('preserves pills_remaining on partial medication name update', () {
      final existing = {
        'id': 'm1',
        'user_id': 'u1',
        'name': 'Keppra',
        'pills_remaining': 28,
        'refill_threshold': 7,
        'active': true,
      };
      final merged = mergeCachedPayload(existing, {
        'id': 'm1',
        'user_id': 'u1',
        'name': 'Levetiracetam',
        'updated_at': '2026-07-12T12:00:00.000Z',
      });
      expect(merged['name'], 'Levetiracetam');
      expect(merged['pills_remaining'], 28);
      expect(merged['refill_threshold'], 7);
    });

    test('applies refill pills_remaining without dropping other fields', () {
      final existing = {
        'id': 'm1',
        'user_id': 'u1',
        'name': 'Keppra',
        'pills_remaining': 0,
        'dosage': '500 mg',
        'active': true,
      };
      final merged = mergeCachedPayload(existing, {
        'id': 'm1',
        'user_id': 'u1',
        'pills_remaining': 90,
        'updated_at': '2026-07-12T12:00:00.000Z',
      });
      expect(merged['pills_remaining'], 90);
      expect(merged['name'], 'Keppra');
      expect(merged['dosage'], '500 mg');
    });
  });

  group('pillStockDelta', () {
    test('decrements when status becomes taken', () {
      expect(
        pillStockDelta(oldStatus: 'pending', newStatus: 'taken', amount: 1),
        1,
      );
      expect(
        pillStockDelta(oldStatus: 'skipped', newStatus: 'taken', amount: 2),
        2,
      );
    });

    test('restores when leaving taken', () {
      expect(
        pillStockDelta(oldStatus: 'taken', newStatus: 'pending', amount: 1),
        -1,
      );
    });

    test('no-op when status unchanged', () {
      expect(
        pillStockDelta(oldStatus: 'taken', newStatus: 'taken', amount: 1),
        isNull,
      );
      expect(
        pillStockDelta(oldStatus: 'pending', newStatus: 'skipped'),
        isNull,
      );
    });

    test('defaults amount to 1', () {
      expect(
        pillStockDelta(oldStatus: 'pending', newStatus: 'taken'),
        1,
      );
    });
  });
}
