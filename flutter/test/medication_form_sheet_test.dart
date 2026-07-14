import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/meds/medication_form_sheet.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/meds/models/medication.dart';

Finder _fieldByHint(String hint) {
  return find.byWidgetPredicate(
    (widget) =>
        widget is TextField && widget.decoration?.hintText == hint,
  );
}

ThemeData _testTheme() => ThemeData(
      useMaterial3: true,
      splashFactory: NoSplash.splashFactory,
    );

void main() {
  group('MedicationFormSheet pills remaining', () {
    testWidgets('shows Pills on hand and Alert at for scheduled meds',
        (tester) async {
      final fake = _FakeMedsRepository();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            medsRepositoryProvider.overrideWithValue(fake),
          ],
          child: MaterialApp(
            theme: _testTheme(),
            home: Scaffold(
              body: Builder(
                builder: (context) => TextButton(
                  onPressed: () => MedicationFormSheet.show(context),
                  child: const Text('Open'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open'));
      await tester.pump(); // avoid ink_sparkle.frag via pumpAndSettle splash
      await tester.pump(const Duration(milliseconds: 300));

      // MedsSectionEyebrow uppercases section labels.
      expect(find.text('UPDATE STOCK'), findsOneWidget);
      expect(find.textContaining('Pills on hand after a refill'), findsOneWidget);
      expect(_fieldByHint('Pills on hand'), findsOneWidget);
      expect(_fieldByHint('Alert at'), findsOneWidget);
    });

    testWidgets('hides stock fields for rescue meds', (tester) async {
      final fake = _FakeMedsRepository();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            medsRepositoryProvider.overrideWithValue(fake),
          ],
          child: MaterialApp(
            theme: _testTheme(),
            home: Scaffold(
              body: Builder(
                builder: (context) => TextButton(
                  onPressed: () => MedicationFormSheet.show(
                    context,
                    initialKind: 'rescue',
                  ),
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

      expect(find.text('UPDATE STOCK'), findsNothing);
      expect(_fieldByHint('Pills on hand'), findsNothing);
      expect(_fieldByHint('Alert at'), findsNothing);
    });

    testWidgets('create passes pillsRemaining and refillThreshold',
        (tester) async {
      final fake = _FakeMedsRepository();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            medsRepositoryProvider.overrideWithValue(fake),
          ],
          child: MaterialApp(
            theme: _testTheme(),
            home: Scaffold(
              body: Builder(
                builder: (context) => TextButton(
                  onPressed: () => MedicationFormSheet.show(context),
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

      await tester.enterText(
        _fieldByHint('Search medications'),
        'Keppra',
      );
      await tester.enterText(_fieldByHint('Amount'), '500');
      await tester.enterText(_fieldByHint('Pills on hand'), '90');
      await tester.enterText(_fieldByHint('Alert at'), '14');
      await tester.pump();

      await tester.tap(find.text('Save'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(fake.createdName, 'Keppra');
      expect(fake.createdPills, 90);
      expect(fake.createdThreshold, 14);
    });

    testWidgets('edit hydrates stock and updateMedication sends updateStock',
        (tester) async {
      final fake = _FakeMedsRepository(
        existing: const Medication(
          id: 'm1',
          name: 'Lamictal',
          active: true,
          kind: 'medication',
          isRescue: false,
          dosageAmount: 100,
          dosageUnit: 'mg',
          timesOfDay: ['08:00'],
          pillsRemaining: 30,
          refillThreshold: 10,
        ),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            medsRepositoryProvider.overrideWithValue(fake),
          ],
          child: MaterialApp(
            theme: _testTheme(),
            home: Scaffold(
              body: Builder(
                builder: (context) => TextButton(
                  onPressed: () => MedicationFormSheet.show(
                    context,
                    editingMedId: 'm1',
                  ),
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

      final pillsField =
          tester.widget<TextField>(_fieldByHint('Pills on hand'));
      final alertField = tester.widget<TextField>(_fieldByHint('Alert at'));
      expect(pillsField.controller?.text, '30');
      expect(alertField.controller?.text, '10');

      await tester.enterText(_fieldByHint('Pills on hand'), '60');
      await tester.enterText(_fieldByHint('Alert at'), '12');
      await tester.pump();

      await tester.tap(find.text('Save'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(fake.updatedMedId, 'm1');
      expect(fake.updatedPills, 60);
      expect(fake.updatedThreshold, 12);
      expect(fake.updatedStock, isTrue);
    });
  });
}

class _FakeMedsRepository implements MedsRepository {
  _FakeMedsRepository({this.existing});

  final Medication? existing;

  String? createdName;
  int? createdPills;
  int? createdThreshold;

  String? updatedMedId;
  int? updatedPills;
  int? updatedThreshold;
  bool? updatedStock;

  @override
  Future<Medication?> loadMedicationById(String medId) async => existing;

  @override
  Future<Medication> createMedication({
    required String name,
    required String kind,
    String? dosageAmount,
    String? dosageUnit,
    List<String> timesOfDay = const ['08:00'],
    bool isRescue = false,
    int? pillsRemaining,
    int refillThreshold = 7,
  }) async {
    createdName = name;
    createdPills = pillsRemaining;
    createdThreshold = refillThreshold;
    return Medication(
      id: 'new',
      name: name,
      active: true,
      kind: kind,
      isRescue: isRescue,
      pillsRemaining: pillsRemaining,
      refillThreshold: refillThreshold,
    );
  }

  @override
  Future<void> updateMedication(
    String medId, {
    required String name,
    required String kind,
    String? dosageAmount,
    String? dosageUnit,
    List<String> timesOfDay = const ['08:00'],
    Medication? existing,
    int? pillsRemaining,
    int? refillThreshold,
    bool updateStock = false,
  }) async {
    updatedMedId = medId;
    updatedPills = pillsRemaining;
    updatedThreshold = refillThreshold;
    updatedStock = updateStock;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
