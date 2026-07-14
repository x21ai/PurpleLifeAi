import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/design/tokens.dart';
import 'package:purple_app/features/journal/journal_capture_screen.dart';
import 'package:purple_app/features/journal/models/journal_entry.dart';
import 'support/purple_test_theme.dart';

void main() {
  setUpAll(() async {
    await PurpleTokens.load();
  });
  group('JournalEntry pendingUpload', () {
    test('AI processing status does not imply pending upload', () {
      final entry = JournalEntry.fromJson({
        'id': 'entry-1',
        'captured_at': '2026-01-01T12:00:00Z',
        'status': 'processing',
      });

      expect(entry.isProcessing, isTrue);
      expect(entry.pendingUpload, isFalse);
    });

    test('pending upload is explicit, separate from processing UI', () {
      final entry = JournalEntry.fromJson(
        {
          'id': 'entry-2',
          'captured_at': '2026-01-01T12:00:00Z',
          'status': 'processing',
        },
        pendingUpload: true,
      );

      expect(entry.isProcessing, isTrue);
      expect(entry.pendingUpload, isTrue);
    });
  });

  group('JournalCaptureScreen P0 layout', () {
    testWidgets(
      'Save stays below stripped MediaQuery.padding using viewPadding',
      (tester) async {
        // Mirrors NativeAppShell: padding cleared, viewPadding still set
        // (Dynamic Island / status bar). Regression: Save drew under status bar.
        await tester.pumpWidget(
          ProviderScope(
            child: MediaQuery(
              data: const MediaQueryData(
                size: Size(390, 844),
                padding: EdgeInsets.zero,
                viewPadding: EdgeInsets.only(top: 59, bottom: 34),
                viewInsets: EdgeInsets.zero,
              ),
              child: MaterialApp(
          theme: purpleTestTheme(),
                home: JournalCaptureScreen(),
              ),
            ),
          ),
        );
        await tester.pump();

        final save = find.widgetWithText(FilledButton, 'Save');
        expect(save, findsOneWidget);

        final saveBox = tester.getRect(save);
        expect(
          saveBox.top,
          greaterThanOrEqualTo(59),
          reason: 'Save must clear status bar / Dynamic Island',
        );
        expect(find.text('New entry'), findsOneWidget);
        expect(find.byTooltip('Dismiss keyboard'), findsOneWidget);
        expect(find.text('Photo'), findsOneWidget);
        expect(find.text('Coming soon'), findsNWidgets(2));
      },
    );

    testWidgets('dismiss keyboard control clears text focus', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MediaQuery(
            data: const MediaQueryData(
              size: Size(390, 844),
              padding: EdgeInsets.zero,
              viewPadding: EdgeInsets.only(top: 59, bottom: 34),
            ),
            child: MaterialApp(
          theme: purpleTestTheme(),
              home: JournalCaptureScreen(),
            ),
          ),
        ),
      );
      await tester.pump();

      final field = tester.widget<TextField>(find.byType(TextField).first);
      expect(field.focusNode?.hasFocus, isTrue);

      await tester.tap(find.byTooltip('Dismiss keyboard'));
      await tester.pump();

      final after = tester.widget<TextField>(find.byType(TextField).first);
      expect(after.focusNode?.hasFocus, isFalse);
    });

    testWidgets('typing enables Save', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MediaQuery(
            data: const MediaQueryData(
              size: Size(390, 844),
              padding: EdgeInsets.zero,
              viewPadding: EdgeInsets.only(top: 59),
            ),
            child: MaterialApp(
          theme: purpleTestTheme(),
              home: JournalCaptureScreen(),
            ),
          ),
        ),
      );
      await tester.pump();

      final saveButton = tester.widget<FilledButton>(
        find.widgetWithText(FilledButton, 'Save'),
      );
      expect(saveButton.onPressed, isNull);

      await tester.enterText(
        find.byType(TextField).first,
        'Hit from behind',
      );
      await tester.pump();

      final enabled = tester.widget<FilledButton>(
        find.widgetWithText(FilledButton, 'Save'),
      );
      expect(enabled.onPressed, isNotNull);
    });
  });
}
