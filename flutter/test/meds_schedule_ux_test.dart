import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/meds/dose_list.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/meds/meds_screen.dart';
import 'package:purple_app/features/meds/models/dose.dart';
import 'package:purple_app/features/meds/models/medication.dart';

void main() {
  group('TodayDosePanel schedule UX', () {
    testWidgets('shows date navigator and 24h timeline labels', (tester) async {
      final dose = MedicationDose(
        id: 'd1',
        medicationId: 'm1',
        scheduledAt: DateTime.parse('2026-07-05T14:00:00Z'),
        status: 'pending',
        medication: Medication(
          id: 'm1',
          name: 'Keppra',
          active: true,
          kind: 'medication',
          isRescue: false,
          timesOfDay: const ['08:00', '20:00'],
        ),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TodayDosePanel(
              doses: [dose],
              timezone: 'America/New_York',
              todayLabel: 'Saturday, July 5, 2026',
              viewDate: '2026-07-05',
              todayStr: '2026-07-05',
              onChangeDate: (_) {},
              onTaken: (_) {},
              onSkip: (_) {},
              onSnooze: (_) {},
              onReclassify: (_, __) {},
              onAddMed: () {},
            ),
          ),
        ),
      );

      expect(find.text("Today's doses"), findsOneWidget);
      expect(find.text('12a'), findsNWidgets(2));
      expect(find.text('6p'), findsOneWidget);
      expect(find.byIcon(Icons.chevron_left), findsOneWidget);
      expect(find.text('2026-07-05'), findsOneWidget);
    });

    testWidgets('past day hides adherence and uses alternate title', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TodayDosePanel(
              doses: const [],
              timezone: 'UTC',
              todayLabel: 'Friday, July 4, 2026',
              viewDate: '2026-07-04',
              todayStr: '2026-07-05',
              adherencePct: 88,
              onChangeDate: (_) {},
              onTaken: (_) {},
              onSkip: (_) {},
              onSnooze: (_) {},
              onReclassify: (_, __) {},
              onAddMed: () {},
            ),
          ),
        ),
      );

      expect(find.text('Doses for this day'), findsOneWidget);
      expect(find.text('88%'), findsNothing);
    });
  });

  group('MedsScreen toolbar and FAB', () {
    testWidgets('renders four toolbar actions and mobile FAB', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);

      final data = MedsData(
        medications: const [],
        todayDoses: const [],
        isOffline: false,
        loadedAt: DateTime.now(),
        timezone: 'UTC',
        todayLabel: 'Saturday, July 5, 2026',
        todayStr: '2026-07-05',
        viewDateStr: '2026-07-05',
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            medsScheduleProvider(null).overrideWith((ref) async => data),
          ],
          child: const MaterialApp(home: MedsScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.add), findsWidgets);
      expect(find.byIcon(Icons.photo_camera_outlined), findsOneWidget);
      expect(find.byIcon(Icons.mic_none_outlined), findsOneWidget);
      expect(find.byIcon(Icons.history), findsOneWidget);
    });
  });
}
