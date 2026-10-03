import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/auth/ploy_access_chrome.dart';
import 'package:purple_app/shell/bottom_nav.dart';

void main() {
  testWidgets('short phone can scroll to the sign-in button', (tester) async {
    tester.view.physicalSize = const Size(390, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        home: PloyAccessPage(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const PloyAccessHeader(
                  eyebrow: 'Private account',
                  title: 'Sign in to PurpleLife.',
                  subtitle: 'Use your PurpleLife account password.',
                ),
                const SizedBox(height: 32),
                PloyAccentButton(label: 'Sign in', onPressed: _noop),
              ],
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    await tester.scrollUntilVisible(
      find.text('Sign in'),
      80,
      scrollable: find.byType(Scrollable),
    );
    expect(find.text('Sign in'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('tabs are Today Journal Browse and More', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Align(
            alignment: Alignment.bottomCenter,
            child: BottomNav(location: '/today'),
          ),
        ),
      ),
    );

    expect(find.text('Today'), findsOneWidget);
    expect(find.text('Journal'), findsOneWidget);
    expect(find.text('Browse'), findsOneWidget);
    expect(find.text('More'), findsOneWidget);
    expect(find.text('Ask Maya'), findsNothing);
    expect(find.text('Data'), findsNothing);
    expect(find.text('Plan'), findsNothing);
    expect(find.byIcon(Icons.add), findsNothing);
  });
}

void _noop() {}
