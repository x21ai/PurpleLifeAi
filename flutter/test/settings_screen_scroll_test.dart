import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/design/purple_theme.dart';
import 'package:purple_app/features/settings/platform_flags.dart';
import 'package:purple_app/features/settings/settings_screen.dart';
import 'package:purple_app/features/settings/settings_sections.dart';

/// Regression guard: /settings must render all inline scroll sections in web
/// order (Preferences through About), not just hub navigation rows.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> pumpSettings(WidgetTester tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          settingsProfileFlagsProvider.overrideWith(
            (ref) => Future.value(
              const SettingsProfileFlags(
                conditions: const ['epilepsy'],
                isAdmin: true,
              ),
            ),
          ),
          platformFlagsProvider.overrideWith(
            (ref) => Future.value(const PlatformFlags(community: true)),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: SettingsScreen())),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('renders all inline settings sections on scroll', (tester) async {
    await pumpSettings(tester);

    expect(tester.takeException(), isNull);

    const sectionKeys = [
      Key('settings-preferences'),
      Key('settings-ai-provider'),
      Key('settings-what-i-track'),
      Key('settings-health-history'),
      Key('settings-data'),
      Key('settings-about'),
    ];
    for (final key in sectionKeys) {
      expect(find.byKey(key), findsOneWidget);
    }

    const sectionTitles = [
      'Preferences',
      'AI provider',
      'What I track',
      'Health history',
      'Your data',
      'About',
      'Add past history',
      'Contact the team',
      'Admin console',
    ];
    for (final title in sectionTitles) {
      await tester.scrollUntilVisible(
        find.text(title),
        400,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text(title), findsOneWidget);
    }

    expect(
      find.textContaining('Looking for connections'),
      findsOneWidget,
    );
  });
}
