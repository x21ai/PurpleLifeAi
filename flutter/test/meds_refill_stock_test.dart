import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/meds/dose_list.dart';
import 'package:purple_app/features/meds/med_refill_sheet.dart';
import 'package:purple_app/features/meds/models/medication.dart';
import 'support/purple_test_theme.dart';

void main() {
  group('Medication stock flags (pills_remaining)', () {
    test('outOfStock when pills_remaining is 0', () {
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

    test('not outOfStock when pills_remaining > 0', () {
      const med = Medication(
        id: 'm1',
        name: 'Keppra',
        active: true,
        kind: 'medication',
        isRescue: false,
        pillsRemaining: 30,
        refillThreshold: 7,
      );
      expect(med.outOfStock, isFalse);
      expect(med.lowStock, isFalse);
    });

    test('parses pills_remaining and refill_threshold from JSON', () {
      final med = Medication.fromJson({
        'id': 'm1',
        'name': 'Keppra',
        'active': true,
        'kind': 'medication',
        'is_rescue': false,
        'pills_remaining': 0,
        'refill_threshold': 5,
      });
      expect(med.pillsRemaining, 0);
      expect(med.refillThreshold, 5);
      expect(med.outOfStock, isTrue);
    });
  });

  group('MedRefillSheet', () {
    testWidgets('shows Update stock field for zero pills', (tester) async {
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
          child: MaterialApp(
            theme: purpleTestTheme(),
            home: Scaffold(
              body: MedRefillSheet(medication: med),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Update stock'), findsOneWidget);
      expect(find.text('Currently 0 pills left'), findsOneWidget);
      expect(find.text('Pills remaining after refill'), findsOneWidget);
      expect(find.text('I refilled'), findsOneWidget);
    });
  });

  group('MedLibraryRow Update stock', () {
    testWidgets('shows Update stock when out of stock', (tester) async {
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
      await tester.pumpAndSettle();

      expect(find.text('OUT OF STOCK'), findsOneWidget);
      expect(find.text('Update stock'), findsWidgets);

      await tester.tap(find.text('Update stock').first);
      await tester.pumpAndSettle();
      expect(refillTapped, isTrue);
    });
  });
}
