import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';
import 'package:purple_app/core/providers/core_providers.dart';
import 'package:purple_app/design/purple_theme.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/reports/models/report_row.dart';
import 'package:purple_app/features/reports/reports_repository.dart';
import 'package:purple_app/features/today/models/score_snapshot.dart';
import 'package:purple_app/features/today/models/today_data.dart';
import 'package:purple_app/features/today/missed_dose_catchup.dart';
import 'package:purple_app/features/today/today_meds_section.dart';
import 'package:purple_app/features/today/today_repository.dart';
import 'package:purple_app/features/today/today_screen.dart';
import 'package:purple_app/shell/native_app_shell.dart';
import 'package:purple_app/shell/routes.dart';

/// Regression for `tf27-stuck-keyboard`.
///
/// Shell tests are light (NativeAppShell only). Today tests skip Wearables
/// because SyncStatusBar asserts without Supabase in widget tests.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('NativeAppShell unfocus', () {
    const notesKey = Key('shell-unfocus-notes');

    Finder shellDismissDetector() {
      return find.ancestor(
        of: find.byType(Scaffold),
        matching: find.byWidgetPredicate(
          (w) =>
              w is GestureDetector &&
              w.behavior == HitTestBehavior.translucent &&
              w.onTap != null,
        ),
      );
    }

    Future<void> pumpShell(
      WidgetTester tester, {
      required FocusNode focusNode,
      required String location,
      void Function(void Function(String location) setLocation)? onLocationReady,
    }) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            isOnlineProvider.overrideWith((ref) => Stream.value(true)),
          ],
          child: MaterialApp(
            theme: PurpleTheme.dark(),
            home: _ShellLocationHost(
              initialLocation: location,
              onReady: onLocationReady,
              childBuilder: (loc) => NativeAppShell(
                location: loc,
                child: ListView(
                  children: [
                    TextField(
                      key: notesKey,
                      focusNode: focusNode,
                      decoration: const InputDecoration(
                        hintText: 'shell-unfocus-notes',
                      ),
                    ),
                    const SizedBox(height: 1600),
                    const Text('scroll-bottom'),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
    }

    Future<void> focusNotes(WidgetTester tester, FocusNode focusNode) async {
      await tester.tap(find.byKey(notesKey));
      await tester.pump();
      focusNode.requestFocus();
      await tester.pump();
      expect(focusNode.hasFocus, isTrue);
    }

    testWidgets('GestureDetector onTap unfocuses primary field', (tester) async {
      final focusNode = FocusNode();
      addTearDown(focusNode.dispose);

      await pumpShell(
        tester,
        focusNode: focusNode,
        location: AppRoutes.journalNew,
      );
      await focusNotes(tester, focusNode);

      // Nested scrollables steal the tap arena in widget tests; invoke the
      // shell translucent onTap directly. Scroll-drag + location cover pointers.
      final detector = tester.widget<GestureDetector>(shellDismissDetector());
      detector.onTap!();
      await tester.pump();

      expect(focusNode.hasFocus, isFalse);
    });

    testWidgets('scroll drag unfocuses primary field', (tester) async {
      final focusNode = FocusNode();
      addTearDown(focusNode.dispose);

      await pumpShell(
        tester,
        focusNode: focusNode,
        location: AppRoutes.journalNew,
      );
      await focusNotes(tester, focusNode);

      await tester.drag(find.byType(ListView), const Offset(0, -120));
      await tester.pump();

      expect(focusNode.hasFocus, isFalse);
    });

    testWidgets('location change unfocuses primary field', (tester) async {
      final focusNode = FocusNode();
      addTearDown(focusNode.dispose);
      late void Function(String) setLocation;

      await pumpShell(
        tester,
        focusNode: focusNode,
        location: AppRoutes.journalNew,
        onLocationReady: (setter) => setLocation = setter,
      );
      await focusNotes(tester, focusNode);

      setLocation(AppRoutes.today);
      await tester.pumpAndSettle();

      expect(focusNode.hasFocus, isFalse);
    });
  });

  group('Today expand unfocus', () {
    testWidgets('expand toggle unfocuses quick-log field', (tester) async {
      tester.view.physicalSize = const Size(390, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final todayYmd = DateFormat('yyyy-MM-dd').format(DateTime.now());
      const data = TodayData(
        scores: ScoreSnapshot(
          readiness: 80,
          sleepScore: 70,
          activity: 60,
          hasData: true,
        ),
        firstName: 'Alex',
        narrative: 'Steady day.',
        conditions: ['epilepsy'],
        medicationCount: 0,
        journalEntryCount: 2,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            todayDataProvider.overrideWith((ref) => Future.value(data)),
            reportsHubProvider.overrideWith(
              (ref) => Future.value(ReportsHubData.empty),
            ),
            medsForDayProvider(todayYmd).overrideWith(
              (ref) => Future.value(
                MedsData(
                  medications: const [],
                  todayDoses: const [],
                  isOffline: false,
                  loadedAt: DateTime.now(),
                  timezone: 'UTC',
                  todayLabel: 'Today',
                  todayStr: todayYmd,
                  viewDateStr: todayYmd,
                ),
              ),
            ),
            missedDoseCatchupProvider.overrideWith((ref) async => null),
          ],
          child: MaterialApp(
            theme: PurpleTheme.dark().copyWith(
              splashFactory: NoSplash.splashFactory,
            ),
            home: const Scaffold(body: TodayScreen()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final scrollViews = tester.widgetList<SingleChildScrollView>(
        find.byType(SingleChildScrollView),
      );
      expect(
        scrollViews.any(
          (v) =>
              v.keyboardDismissBehavior ==
              ScrollViewKeyboardDismissBehavior.onDrag,
        ),
        isTrue,
        reason: 'Today scroll must dismiss keyboard on drag',
      );

      await tester.tap(find.text('Log'));
      await tester.pumpAndSettle();
      expect(find.text('What happened?'), findsOneWidget);

      final editable = find.byType(EditableText);
      expect(editable, findsWidgets);
      await tester.tap(editable.first);
      await tester.pump();
      expect(
        tester
            .widgetList<EditableText>(editable)
            .any((e) => e.focusNode.hasFocus),
        isTrue,
      );

      await tester.tap(find.text('Hydration'));
      await tester.pumpAndSettle();

      expect(
        tester.widgetList<EditableText>(find.byType(EditableText)).any(
              (e) => e.focusNode.hasFocus,
            ),
        isFalse,
      );
    });
  });
}

class _ShellLocationHost extends StatefulWidget {
  const _ShellLocationHost({
    required this.initialLocation,
    required this.childBuilder,
    this.onReady,
  });

  final String initialLocation;
  final Widget Function(String location) childBuilder;
  final void Function(void Function(String location) setLocation)? onReady;

  @override
  State<_ShellLocationHost> createState() => _ShellLocationHostState();
}

class _ShellLocationHostState extends State<_ShellLocationHost> {
  late String _location;

  @override
  void initState() {
    super.initState();
    _location = widget.initialLocation;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onReady?.call((next) {
        if (!mounted) return;
        setState(() => _location = next);
      });
    });
  }

  @override
  Widget build(BuildContext context) => widget.childBuilder(_location);
}
