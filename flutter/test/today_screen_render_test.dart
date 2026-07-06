import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';
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
        ],
        child: const MaterialApp(home: Scaffold(body: TodayScreen())),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('renders merged Today with score data and narrative',
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
    expect(find.textContaining(', Alex.'), findsOneWidget);
    expect(find.text(DateFormat('EEEE, MMMM d').format(DateTime.now())),
        findsOneWidget);
    // Merged metric strip (Ready / Sleep / Activity).
    expect(find.text('READY'), findsOneWidget);
    expect(find.text('SLEEP'), findsOneWidget);
    expect(find.text('ACTIVITY'), findsOneWidget);
    expect(find.text('82'), findsOneWidget);
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
}
