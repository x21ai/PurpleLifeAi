import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/offline/database.dart';
import 'package:purple_app/core/offline/sync_service.dart';

void main() {
  late AppDatabase db;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
  });

  tearDown(() async {
    await db.close();
  });

  test('partial dose Taken merge keeps scheduled fields in cache', () async {
    const userId = 'u1';
    const doseId = 'd1';
    const medId = 'm1';
    final scheduled = DateTime.utc(2026, 7, 12, 12);

    await db.upsertDoseCache(
      id: doseId,
      userId: userId,
      medicationId: medId,
      payload: {
        'id': doseId,
        'user_id': userId,
        'medication_id': medId,
        'scheduled_at': scheduled.toIso8601String(),
        'status': 'pending',
        'amount': 1,
      },
      scheduledAt: scheduled,
    );

    await db.enqueueWrite(
      tableName: SyncTables.medicationDoses,
      operation: 'update',
      payload: {
        'id': doseId,
        'user_id': userId,
        'status': 'taken',
        'taken_at': DateTime.utc(2026, 7, 12, 12, 5).toIso8601String(),
      },
      recordId: doseId,
    );

    expect(
      await db.hasPendingWrite(
        tableName: SyncTables.medicationDoses,
        recordId: doseId,
      ),
      isTrue,
    );

    final existing = await db.readCachedRow(
      tableName: SyncTables.medicationDoses,
      id: doseId,
      userId: userId,
    );
    final merged = mergeCachedPayload(existing, {
      'id': doseId,
      'user_id': userId,
      'status': 'taken',
      'taken_at': DateTime.utc(2026, 7, 12, 12, 5).toIso8601String(),
    });

    await db.upsertDoseCache(
      id: doseId,
      userId: userId,
      medicationId: merged['medication_id'] as String,
      payload: merged,
      scheduledAt: DateTime.parse(merged['scheduled_at'] as String),
    );

    final cached = await db.readCachedRow(
      tableName: SyncTables.medicationDoses,
      id: doseId,
      userId: userId,
    );
    expect(cached?['status'], 'taken');
    expect(cached?['medication_id'], medId);
    expect(cached?['scheduled_at'], isNotNull);
  });

  test('refill merge preserves medication name in cache', () async {
    const userId = 'u1';
    const medId = 'm1';
    final updatedAt = DateTime.utc(2026, 7, 12);

    await db.upsertMedicationCache(
      id: medId,
      userId: userId,
      payload: {
        'id': medId,
        'user_id': userId,
        'name': 'Keppra',
        'pills_remaining': 0,
        'active': true,
      },
      updatedAt: updatedAt,
    );

    final existing = await db.readCachedRow(
      tableName: SyncTables.medications,
      id: medId,
      userId: userId,
    );
    final merged = mergeCachedPayload(existing, {
      'id': medId,
      'user_id': userId,
      'pills_remaining': 90,
      'updated_at': DateTime.utc(2026, 7, 12, 13).toIso8601String(),
    });

    await db.upsertMedicationCache(
      id: medId,
      userId: userId,
      payload: merged,
      updatedAt: DateTime.parse(merged['updated_at'] as String),
    );

    final cached = await db.readCachedRow(
      tableName: SyncTables.medications,
      id: medId,
      userId: userId,
    );
    expect(cached?['pills_remaining'], 90);
    expect(cached?['name'], 'Keppra');
  });
}
