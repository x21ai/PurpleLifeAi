import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/meds/models/dose.dart';
import 'package:purple_app/features/meds/models/medication.dart';
import 'package:purple_app/features/today/today_meds_section.dart';

void main() {
  testWidgets('TodayMedsSection shows inline Taken for pending dose', (tester) async {
    final todayYmd = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final medsData = MedsData(
      medications: const [
        Medication(
          id: 'm1',
          name: 'Keppra',
          active: true,
          kind: 'medication',
          isRescue: false,
          timesOfDay: ['08:00'],
        ),
      ],
      todayDoses: [
        MedicationDose(
          id: 'd1',
          medicationId: 'm1',
          scheduledAt: DateTime.parse('${todayYmd}T13:00:00Z'),
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
      ],
      isOffline: false,
      loadedAt: DateTime.now(),
      timezone: 'UTC',
      todayLabel: 'Today',
      todayStr: todayYmd,
      viewDateStr: todayYmd,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          medsForDayProvider(todayYmd).overrideWith((ref) async => medsData),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: TodayMedsSection(
              selectedDate: DateTime.now(),
              isToday: true,
              medicationCount: 1,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Taken'), findsOneWidget);
    expect(find.text('Snooze'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
    expect(find.text('Pending'), findsNothing);

    final takenRect = tester.getRect(find.widgetWithText(FilledButton, 'Taken'));
    expect(takenRect.height, greaterThanOrEqualTo(44));
  });

  testWidgets(
    'TodayMedsSection 0 pills left chip opens refill sheet',
    (tester) async {
      final todayYmd = DateFormat('yyyy-MM-dd').format(DateTime.now());
      const outOfStockMed = Medication(
        id: 'm1',
        name: 'Keppra',
        active: true,
        kind: 'medication',
        isRescue: false,
        timesOfDay: ['08:00'],
        pillsRemaining: 0,
      );
      final medsData = MedsData(
        medications: const [outOfStockMed],
        todayDoses: [
          MedicationDose(
            id: 'd1',
            medicationId: 'm1',
            scheduledAt: DateTime.parse('${todayYmd}T13:00:00Z'),
            status: 'pending',
            medication: outOfStockMed,
          ),
        ],
        isOffline: false,
        loadedAt: DateTime.now(),
        timezone: 'UTC',
        todayLabel: 'Today',
        todayStr: todayYmd,
        viewDateStr: todayYmd,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            medsForDayProvider(todayYmd).overrideWith((ref) async => medsData),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: TodayMedsSection(
                selectedDate: DateTime.now(),
                isToday: true,
                medicationCount: 1,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('0 pills left'), findsOneWidget);
      expect(find.text('Refill to update'), findsOneWidget);
      expect(find.text('Taken'), findsNothing);

      await tester.tap(find.text('0 pills left'));
      await tester.pumpAndSettle();

      expect(find.text('Update stock'), findsOneWidget);
      expect(find.text('I refilled'), findsOneWidget);
    },
  );
}
