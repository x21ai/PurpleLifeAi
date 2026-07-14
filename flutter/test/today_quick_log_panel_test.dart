import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/today/today_quick_log_panel.dart';
import 'support/purple_test_theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> pumpLog(
    WidgetTester tester, {
    required bool showSeizure,
  }) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: purpleTestTheme(),
          home: Scaffold(
            body: SingleChildScrollView(
              child: TodayLogExpandBody(
                showSeizure: showSeizure,
                selectedDate: DateTime(2026, 7, 12, 14, 30),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('epilepsy quick log shows Aura / Seizure / Other chips',
      (tester) async {
    await pumpLog(tester, showSeizure: true);

    expect(
      find.text('Capture aura or seizure details without leaving Today.'),
      findsOneWidget,
    );
    expect(find.text('Aura'), findsOneWidget);
    expect(find.text('Seizure'), findsOneWidget);
    expect(find.text('Other'), findsOneWidget);
    expect(find.text('When?'), findsOneWidget);
    expect(find.text('Save'), findsOneWidget);
    expect(find.text('New journal entry'), findsNothing);
    expect(find.text('Log seizure / aura'), findsNothing);
  });

  testWidgets('non-seizure quick log is journal-only without chips',
      (tester) async {
    await pumpLog(tester, showSeizure: false);

    expect(
      find.text('Journal symptoms, mood, and notes in one place.'),
      findsOneWidget,
    );
    expect(find.text('Aura'), findsNothing);
    expect(find.text('Seizure'), findsNothing);
    expect(find.text('Other'), findsNothing);
    expect(find.text('Save'), findsOneWidget);
    expect(find.text('Open journal capture'), findsOneWidget);
  });

  testWidgets('seizure chip reveals full form link', (tester) async {
    await pumpLog(tester, showSeizure: true);

    await tester.tap(find.text('Seizure'));
    await tester.pumpAndSettle();

    expect(find.text('Open full seizure form'), findsOneWidget);
  });
}
