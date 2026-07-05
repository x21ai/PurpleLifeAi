import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/today/models/score_snapshot.dart';
import 'package:purple_app/features/today/models/today_data.dart';
import 'package:purple_app/features/today/today_repository.dart';
import 'package:purple_app/features/today/today_screen.dart';

/// Regression guard for the blank /today content area: any layout exception
/// (unbounded constraints, nested scrollable misuse) must fail these tests
/// instead of silently rendering nothing in release.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> pumpToday(
    WidgetTester tester, {
    required TodayData data,
    MedsData meds = MedsData.empty,
  }) async {
    tester.view.physicalSize = const Size(390, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final todayYmd = DateFormat('yyyy-MM-dd').format(DateTime.now());

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          todayDataProvider.overrideWith((ref) => Future.value(data)),
          medsForDayProvider(todayYmd)
              .overrideWith((ref) => Future.value(meds)),
        ],
        child: const MaterialApp(home: Scaffold(body: TodayScreen())),
      ),
    );
    // First frame is the provider loading state; settle resolves the futures
    // and runs the date-strip post-frame centering.
    await tester.pumpAndSettle();
  }

  testWidgets('renders all sections with score data and narrative',
      (tester) async {
    const data = TodayData(
      scores: ScoreSnapshot(
        readiness: 82,
        sleepScore: 76,
        activity: 64,
        hrvMs: 52,
        restingHr: 58,
        spo2: 97,
        steps: 8042,
        hasData: true,
      ),
      firstName: 'Alex',
      narrative: 'Your signals look steady compared with yesterday.',
      medicationCount: 1,
      journalEntryCount: 3,
    );

    await pumpToday(tester, data: data);

    expect(tester.takeException(), isNull);
    // Greeting header with first name.
    expect(find.textContaining(', Alex.'), findsOneWidget);
    // Date strip: today tile eyebrow plus the MMM d header label.
    expect(find.text('TODAY'), findsOneWidget);
    // Score strip tiles (Readiness / Sleep / Activity, web order); the same
    // labels also appear as signal-grid captions, so allow multiples.
    expect(find.text('READINESS'), findsWidgets);
    expect(find.text('SLEEP'), findsWidgets);
    expect(find.text('ACTIVITY'), findsWidgets);
    expect(find.text('82'), findsWidgets);
    // Signals grid.
    expect(find.text('YOUR SIGNALS'), findsOneWidget);
    expect(find.text('HRV'), findsOneWidget);
    // Narrative appears as the lede and in the narrative block.
    expect(
      find.text('Your signals look steady compared with yesterday.'),
      findsNWidgets(2),
    );
    // Quick actions and doses card.
    expect(find.text('Journal'), findsOneWidget);
    expect(find.text('Meds'), findsOneWidget);
    expect(find.text('No medications scheduled for today.'), findsOneWidget);
    // Disclosure toggle.
    expect(find.text('MORE FOR TODAY'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('renders real empty states with no data', (tester) async {
    await pumpToday(tester, data: TodayData.empty);

    expect(tester.takeException(), isNull);
    // Empty scores render as en dashes inside the strip, never fake numbers.
    expect(find.text('–'), findsNWidgets(3));
    expect(find.text('Connect a device to see your signals'), findsOneWidget);
    // Zero journal entries shows the welcome card with en.json copy.
    expect(find.text('Start where you are.'), findsOneWidget);

    // Expanding the disclosure must not throw either.
    await tester.tap(find.text('MORE FOR TODAY'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}
