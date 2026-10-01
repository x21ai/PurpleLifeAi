import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/hydration/hydration_repository.dart';
import 'package:purple_app/features/meds/med_intelligence_cards.dart';
import 'package:purple_app/features/meds/meds_screen.dart';
import 'package:purple_app/features/meds/meds_segment_timeline.dart';
import 'package:purple_app/features/meds/models/dose.dart';
import 'package:purple_app/features/meds/models/medication.dart';
import 'package:purple_app/features/today/models/score_snapshot.dart';
import 'package:purple_app/features/today/today_merged_layout.dart';
import 'package:purple_app/features/today/today_quick_log_panel.dart';

import 'support/purple_test_theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('signals grid drops null metrics and shows connect empty state',
      (tester) async {
    const partial = ScoreSnapshot(
      hrvMs: 52,
      restingHr: 58,
      hasData: true,
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: purpleTestTheme(),
        home: const Scaffold(
          body: TodayYourSignals(
            scores: partial,
            onViewAll: _noop,
            onMetricTap: _noopKey,
          ),
        ),
      ),
    );

    expect(find.text('HRV'), findsOneWidget);
    expect(find.text('52 ms'), findsOneWidget);
    expect(find.text('Resting HR'), findsOneWidget);
    expect(find.text('Stress'), findsNothing);
    expect(find.text('—'), findsNothing);

    await tester.pumpWidget(
      MaterialApp(
        theme: purpleTestTheme(),
        home: const Scaffold(
          body: TodayYourSignals(
            scores: ScoreSnapshot(hasData: false),
            onViewAll: _noop,
            onMetricTap: _noopKey,
            onConnect: _noop,
          ),
        ),
      ),
    );
    expect(find.text('Connect a device to see your signals'), findsOneWidget);
    expect(find.text('View all ›'), findsNothing);
    expect(find.text('Connect'), findsOneWidget);
  });

  testWidgets('second tap on the focused score opens ScoreHero detail',
      (tester) async {
    tester.view.physicalSize = const Size(400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);

    var openedReading = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: purpleTestTheme(),
        home: Scaffold(
          body: TodayScoreTiles(
            scores: const ScoreSnapshot(
              readiness: 88,
              sleepScore: 76,
              activity: 60,
              hasData: true,
            ),
            narrative: 'Steady compared with yesterday.',
            onSeeFullReading: () => openedReading = true,
          ),
        ),
      ),
    );

    await tester.tap(find.text('SLEEP'));
    await tester.pumpAndSettle();
    expect(find.text('Doing alright.'), findsOneWidget);
    expect(find.text('See the full reading'), findsOneWidget);
    expect(find.text('Steady compared with yesterday.'), findsOneWidget);

    await tester.tap(find.text('See the full reading'));
    await tester.pumpAndSettle();
    expect(openedReading, isTrue);
    expect(find.text('Doing alright.'), findsNothing);
  });

  testWidgets('dose segment bar marks taken segments', (tester) async {
    final doses = [
      MedicationDose(
        id: 'a',
        medicationId: 'm',
        scheduledAt: DateTime(2026, 7, 7, 8),
        status: 'taken',
      ),
      MedicationDose(
        id: 'b',
        medicationId: 'm',
        scheduledAt: DateTime(2026, 7, 7, 20),
        status: 'pending',
      ),
    ];
    await tester.pumpWidget(
      MaterialApp(
        theme: purpleTestTheme(),
        home: Scaffold(body: MedsSegmentTimeline(doses: doses)),
      ),
    );
    expect(find.byKey(const Key('meds-mini-timeline')), findsOneWidget);
  });

  testWidgets('quick log voice and video icons are visible stubs',
      (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: purpleTestTheme(),
          home: Scaffold(
            body: TodayLogExpandBody(
              showSeizure: false,
              selectedDate: DateTime(2026, 7, 12),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.mic_none_outlined), findsOneWidget);
    expect(find.byIcon(Icons.videocam_outlined), findsOneWidget);
    await tester.tap(find.byIcon(Icons.mic_none_outlined));
    await tester.pump();
    expect(find.textContaining('Voice notes are not available'), findsOneWidget);
  });

  testWidgets('Active and Archive are underline tabs', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: purpleTestTheme(),
        home: Scaffold(
          body: MedsActiveArchiveTabs(
            tab: 'active',
            archivedCount: 2,
            onChanged: (_) {},
          ),
        ),
      ),
    );

    expect(find.text('Active'), findsOneWidget);
    expect(find.text('Archive (2)'), findsOneWidget);
    expect(find.byType(FilterChip), findsNothing);
    expect(find.byType(ChoiceChip), findsNothing);

    final active = tester.widget<Container>(
      find.descendant(
        of: find.widgetWithText(InkWell, 'Active'),
        matching: find.byType(Container),
      ).first,
    );
    final border = active.decoration! as BoxDecoration;
    expect(border.border?.bottom.width, 2);
  });

  testWidgets('refill forecast card uses a real pill count', (tester) async {
    const med = Medication(
      id: 'm1',
      name: 'Keppra',
      active: true,
      kind: 'medication',
      isRescue: false,
      timesOfDay: ['08:00'],
      pillsRemaining: 3,
      refillThreshold: 7,
    );
    Medication? opened;
    await tester.pumpWidget(
      MaterialApp(
        theme: purpleTestTheme(),
        home: Scaffold(
          body: MedIntelligenceCards(
            medications: const [med],
            recentDoses: const [],
            onOpenMed: (value) => opened = value,
          ),
        ),
      ),
    );

    expect(find.byKey(const Key('meds-refill-forecast')), findsOneWidget);
    expect(find.textContaining('Keppra runs out in 3 days'), findsOneWidget);
    await tester.tap(find.text('Update count or schedule refill'));
    await tester.pump();
    expect(opened?.id, 'm1');
    expect(find.textContaining('HydrationWeek'), findsNothing);
  });

  test('week bars stay zero when nothing was logged', () {
    expect(HydrationWeekData.empty.hasAny, isFalse);
    expect(HydrationWeekData.empty.dailyMl, hasLength(7));
  });
}

void _noop() {}

void _noopKey(String _) {}
