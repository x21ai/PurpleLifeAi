import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/meds/models/dose.dart';
import 'package:purple_app/features/meds/models/medication.dart';
import 'package:purple_app/features/today/missed_dose_catchup.dart';
import 'support/purple_test_theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('missedDoseCatchupCopy matches preview slim wording', () {
    final scheduled = DateTime(2026, 7, 11, 10, 0);
    final now = DateTime(2026, 7, 12, 9, 0);
    expect(
      missedDoseCatchupCopy(
        scheduledAt: scheduled,
        medName: 'Crestor',
        now: now,
      ),
      'Missed 10:00am Crestor dose yesterday',
    );
  });

  testWidgets('MissedDoseCatchupBanner shows Log dropdown actions',
      (tester) async {
    final item = MissedDoseCatchupItem(
      dose: MedicationDose(
        id: 'd1',
        medicationId: 'm1',
        scheduledAt: DateTime.now().subtract(const Duration(hours: 3)),
        status: 'pending',
        medication: const Medication(
          id: 'm1',
          name: 'Keppra',
          active: true,
          kind: 'medication',
          isRescue: false,
          timesOfDay: ['08:00'],
        ),
      ),
      extraCount: 0,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          missedDoseCatchupProvider.overrideWith((ref) async => item),
        ],
        child: MaterialApp(
          theme: purpleTestTheme(),
          home: Scaffold(
            body: MissedDoseCatchupBanner(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('Missed'), findsOneWidget);
    expect(find.textContaining('Keppra'), findsOneWidget);
    expect(find.text('Log'), findsOneWidget);

    await tester.tap(find.text('Log'));
    await tester.pumpAndSettle();

    expect(find.text('I took it'), findsOneWidget);
    expect(find.text('I missed it'), findsOneWidget);
    expect(find.text('Review in Meds'), findsOneWidget);
    expect(find.text('Not now'), findsOneWidget);
  });
}
