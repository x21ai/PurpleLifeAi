import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/meds/dose_list.dart';
import 'package:purple_app/features/meds/med_refill_sheet.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/meds/models/dose.dart';
import 'package:purple_app/features/meds/models/medication.dart';

import 'support/purple_test_theme.dart';

void main() {
  group('Medication stock helpers', () {
    test('outOfStock when pills_remaining is zero', () {
      const med = Medication(
        id: 'm1',
        name: 'Keppra',
        active: true,
        kind: 'medication',
        isRescue: false,
        pillsRemaining: 0,
        refillThreshold: 7,
      );
      expect(med.outOfStock, isTrue);
      expect(med.lowStock, isTrue);
    });

    test('parses pills_remaining and refill_threshold from JSON', () {
      final med = Medication.fromJson({
        'id': 'm1',
        'name': 'Lamictal',
        'active': true,
        'kind': 'medication',
        'is_rescue': false,
        'pills_remaining': 30,
        'refill_threshold': 14,
      });
      expect(med.pillsRemaining, 30);
      expect(med.refillThreshold, 14);
      expect(med.outOfStock, isFalse);
      expect(med.lowStock, isFalse);
    });
  });

  group('Out-of-stock refill UX', () {
    testWidgets('dose row Refill to update invokes onRefill', (tester) async {
      Medication? refilled;
      final dose = MedicationDose(
        id: 'd1',
        medicationId: 'm1',
        scheduledAt: DateTime.parse('2026-07-12T14:00:00Z'),
        status: 'pending',
        medication: const Medication(
          id: 'm1',
          name: 'Keppra',
          active: true,
          kind: 'medication',
          isRescue: false,
          pillsRemaining: 0,
        ),
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: purpleTestTheme(),
          home: Scaffold(
            body: TodayDosePanel(
              doses: [dose],
              timezone: 'UTC',
              todayLabel: 'Sunday, July 12, 2026',
              viewDate: '2026-07-12',
              todayStr: '2026-07-12',
              onChangeDate: (_) {},
              onTaken: (_) {},
              onSkip: (_) {},
              onSnooze: (_) {},
              onReclassify: (_, __) {},
              onAddMed: () {},
              onRefill: (med) => refilled = med,
            ),
          ),
        ),
      );

      expect(find.text('Refill to update'), findsOneWidget);
      await tester.tap(find.text('Refill to update'));
      await tester.pump();
      expect(refilled?.id, 'm1');
    });

    testWidgets('library row shows Update stock when out of stock',
        (tester) async {
      var refillTapped = false;
      const med = Medication(
        id: 'm1',
        name: 'Keppra',
        active: true,
        kind: 'medication',
        isRescue: false,
        pillsRemaining: 0,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: purpleTestTheme(),
          home: Scaffold(
            body: MedLibraryRow(
              medication: med,
              onTap: () {},
              onRefill: () => refillTapped = true,
            ),
          ),
        ),
      );

      expect(find.text('OUT OF STOCK'), findsOneWidget);
      expect(find.text('Update stock'), findsOneWidget);
      await tester.tap(find.text('Update stock'));
      await tester.pump();
      expect(refillTapped, isTrue);
    });

    testWidgets('MedRefillSheet I refilled updates pills_remaining',
        (tester) async {
      final fake = _FakeMedsRepository();
      const med = Medication(
        id: 'm1',
        name: 'Keppra',
        active: true,
        kind: 'medication',
        isRescue: false,
        pillsRemaining: 0,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            medsRepositoryProvider.overrideWithValue(fake),
          ],
          child: MaterialApp(
            theme: purpleTestTheme(),
            home: Scaffold(
              body: Builder(
                builder: (context) => TextButton(
                  onPressed: () => MedRefillSheet.show(context, med),
                  child: const Text('Open'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Update stock'), findsOneWidget);
      expect(find.text('I refilled'), findsOneWidget);

      await tester.enterText(find.byType(TextField), '60');
      await tester.pump();
      await tester.tap(find.text('I refilled'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(fake.lastMedId, 'm1');
      expect(fake.lastPills, 60);
    });
  });
}

class _FakeMedsRepository implements MedsRepository {
  String? lastMedId;
  int? lastPills;

  @override
  Future<void> updatePillsRemaining(
    String medId, {
    required int? pillsRemaining,
    int? refillThreshold,
  }) async {
    lastMedId = medId;
    lastPills = pillsRemaining;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
