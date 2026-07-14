import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/design/tokens.dart';
import 'package:purple_app/features/today/today_merged_widgets.dart';

/// Regression for `tf27-huge-narrative`: compact 15sp body, not token bodySerif 17.
void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await PurpleTokens.load();
  });

  testWidgets('TodayMayaCard uses compact 15sp body text', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    const narrative =
        'Sleep held steady overnight. Keep hydration and meds on schedule.';

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: TodayMayaCard(narrative: narrative),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text("Today's reading"), findsOneWidget);
    expect(find.text(narrative), findsOneWidget);

    final body = tester.widget<Text>(find.text(narrative));
    expect(body.style?.fontSize, 15);
  });
}
