import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/design/tokens.dart';
import 'package:purple_app/features/shared/score_tile.dart';
import 'package:purple_app/features/today/models/score_snapshot.dart';
import 'package:purple_app/features/today/today_merged_layout.dart';

/// Regression: TF27 Sleep/Activity numerals wrapped digit-per-line (8/2, 5/8)
/// when active tiles used a 56px face in the narrow three-up row.
void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await PurpleTokens.load();
  });

  testWidgets('ScoreTile keeps two-digit values on one line in narrow row',
      (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: ScoreTile(
                    label: 'Readiness',
                    value: 87,
                    active: true,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ScoreTile(
                    label: 'Sleep',
                    value: 82,
                    active: true,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ScoreTile(
                    label: 'Activity',
                    value: 58,
                    active: true,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    expect(find.text('87'), findsOneWidget);
    expect(find.text('82'), findsOneWidget);
    expect(find.text('58'), findsOneWidget);

    for (final value in ['87', '82', '58']) {
      final text = tester.widget<Text>(find.text(value));
      expect(text.maxLines, 1);
      expect(text.softWrap, isFalse);
      expect(text.overflow, TextOverflow.ellipsis);

      // One line at ~40sp; two wrapped digits would be roughly 2x taller.
      final size = tester.getSize(find.text(value));
      expect(size.height, lessThan(48), reason: '$value wrapped vertically');
      expect(size.width, greaterThan(size.height * 0.8),
          reason: '$value should read as a wide numeral, not stacked digits');
    }
  });

  testWidgets('TodayScoreTiles renders readiness/sleep/activity on one line',
      (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: TodayScoreTiles(
              scores: ScoreSnapshot(
                readiness: 87,
                sleepScore: 82,
                activity: 58,
                hasData: true,
              ),
            ),
          ),
        ),
      ),
    );

    expect(find.text('READINESS'), findsOneWidget);
    expect(find.text('SLEEP'), findsOneWidget);
    expect(find.text('ACTIVITY'), findsOneWidget);
    expect(find.text('87'), findsOneWidget);
    expect(find.text('82'), findsOneWidget);
    expect(find.text('58'), findsOneWidget);

    for (final value in ['82', '58']) {
      final size = tester.getSize(find.text(value));
      expect(size.height, lessThan(48));
    }
  });
}
