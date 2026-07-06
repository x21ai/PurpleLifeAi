import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';
import 'package:purple_app/features/reports/models/report_row.dart';
import 'package:purple_app/features/reports/reports_repository.dart';
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
  }) async {
    tester.view.physicalSize = const Size(390, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          todayDataProvider.overrideWith((ref) => Future.value(data)),
          reportsHubProvider.overrideWith(
            (ref) => Future.value(ReportsHubData.empty),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: TodayScreen())),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('renders merged Today with dual hero, date strip, and narrative',
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
      conditions: const ['epilepsy'],
      medicationCount: 1,
      journalEntryCount: 3,
    );

    await pumpToday(tester, data: data);

    expect(tester.takeException(), isNull);
    expect(find.textContaining(', Alex.'), findsOneWidget);
    // Date strip header + today tile eyebrow.
    expect(
      find.text(DateFormat('MMM d').format(DateTime.now())),
      findsOneWidget,
    );
    expect(find.text('TODAY'), findsOneWidget);
    // Dual score hero.
    expect(find.text('READINESS'), findsOneWidget);
    expect(find.text('SLEEP'), findsWidgets);
    expect(find.text('82'), findsWidgets);
    expect(find.text('76'), findsWidgets);
    // Metric strip still present.
    expect(find.text('HRV'), findsOneWidget);
    // Single Maya narrative surface.
    expect(find.text('MAYA · daily insight'), findsOneWidget);
    expect(
      find.text('Your signals look steady compared with yesterday.'),
      findsOneWidget,
    );
    expect(find.text('See full plan'), findsOneWidget);
    expect(find.text('Journal'), findsOneWidget);
    expect(find.text('Meds'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('renders merged empty welcome when no journal entries',
      (tester) async {
    await pumpToday(tester, data: TodayData.empty);

    expect(tester.takeException(), isNull);
    expect(find.text('Start where you are.'), findsOneWidget);
    expect(find.text('Daily check-in'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('shows error banner with merged empty state on load failure',
      (tester) async {
    const data = TodayData(
      scores: ScoreSnapshot.empty,
      loadError: todayLoadErrorBannerMessage,
    );

    await pumpToday(tester, data: data);

    expect(tester.takeException(), isNull);
    expect(find.text(todayLoadErrorBannerMessage), findsOneWidget);
    expect(find.text('Start where you are.'), findsOneWidget);
    expect(find.text('Daily check-in'), findsOneWidget);
    expect(find.text('TODAY'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
