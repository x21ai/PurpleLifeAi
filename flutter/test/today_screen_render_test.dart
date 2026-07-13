import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/meds/models/dose.dart';
import 'package:purple_app/features/meds/models/medication.dart';
import 'package:purple_app/features/reports/models/report_row.dart';
import 'package:purple_app/features/reports/reports_repository.dart';
import 'package:purple_app/features/today/models/score_snapshot.dart';
import 'package:purple_app/features/today/models/today_data.dart';
import 'package:purple_app/features/today/missed_dose_catchup.dart';
import 'package:purple_app/features/today/today_meds_section.dart';
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
    MedsData? medsData,
    ReportsHubData? reportsHub,
  }) async {
    tester.view.physicalSize = const Size(390, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final todayYmd = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final resolvedMeds = medsData ??
        MedsData(
          medications: const [],
          todayDoses: const [],
          isOffline: false,
          loadedAt: DateTime.now(),
          timezone: 'UTC',
          todayLabel: 'Today',
          todayStr: todayYmd,
          viewDateStr: todayYmd,
        );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          todayDataProvider.overrideWith((ref) => Future.value(data)),
          reportsHubProvider.overrideWith(
            (ref) => Future.value(reportsHub ?? ReportsHubData.empty),
          ),
          medsForDayProvider(todayYmd).overrideWith(
            (ref) => Future.value(resolvedMeds),
          ),
          missedDoseCatchupProvider.overrideWith((ref) async => null),
        ],
        child: const MaterialApp(home: Scaffold(body: TodayScreen())),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('renders merged Today with score tiles, signals, Maya, and meds',
      (tester) async {
    const data = TodayData(
      scores: ScoreSnapshot(
        readiness: 82,
        sleepScore: 76,
        sleepEfficiencyPct: 74,
        activity: 64,
        hrvMs: 52,
        restingHr: 58,
        spo2: 97,
        steps: 8042,
        hasData: true,
      ),
      firstName: 'Alex',
      narrative: 'Your signals look steady compared with yesterday.',
      conditions: ['epilepsy'],
      medicationCount: 1,
      journalEntryCount: 3,
    );

    final todayYmd = DateFormat('yyyy-MM-dd').format(DateTime.now());
    await pumpToday(
      tester,
      data: data,
      reportsHub: const ReportsHubData(
        documents: [
          ReportDocumentRow(
            id: 'r1',
            title: 'CBC',
            fileMime: 'application/pdf',
            status: 'ready',
            createdAt: '2026-07-01T00:00:00Z',
          ),
        ],
        medicalReports: [],
      ),
      medsData: MedsData(
        medications: const [
          Medication(
            id: 'm1',
            name: 'Keppra',
            active: true,
            kind: 'medication',
            isRescue: false,
            timesOfDay: ['08:00', '20:00'],
          ),
        ],
        todayDoses: [
          MedicationDose(
            id: 'd1',
            medicationId: 'm1',
            scheduledAt: DateTime.parse('${todayYmd}T13:00:00Z'),
            status: 'pending',
            medication: const Medication(
              id: 'm1',
              name: 'Keppra',
              active: true,
              kind: 'medication',
              isRescue: false,
              timesOfDay: ['08:00', '20:00'],
            ),
          ),
        ],
        isOffline: false,
        loadedAt: DateTime.now(),
        timezone: 'UTC',
        todayLabel: 'Today',
        todayStr: todayYmd,
        viewDateStr: todayYmd,
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.textContaining(', Alex.'), findsOneWidget);
    expect(
      find.text(DateFormat('EEEE, MMM d').format(DateTime.now())),
      findsOneWidget,
    );
    expect(find.text('TODAY'), findsOneWidget);
    expect(find.text('READINESS'), findsOneWidget);
    expect(find.text('SLEEP'), findsOneWidget);
    expect(find.text('ACTIVITY'), findsOneWidget);
    expect(find.text('YOUR SIGNALS'), findsOneWidget);
    expect(find.text('HRV'), findsOneWidget);
    expect(find.text('Resting HR'), findsOneWidget);
    expect(find.text('52 ms'), findsOneWidget);
    expect(find.text("Today's reading"), findsOneWidget);
    expect(
      find.text('Your signals look steady compared with yesterday.'),
      findsOneWidget,
    );
    expect(find.text('Meds'), findsOneWidget);
    expect(find.text('Hydration'), findsOneWidget);
    expect(find.text('LAST 7 DAYS'), findsOneWidget);
    expect(find.text('RECOMMENDED'), findsOneWidget);
    expect(find.text('Open Plan'), findsOneWidget);
    expect(find.text('Keppra'), findsOneWidget);
    expect(find.text("Today's doses"), findsOneWidget);
    expect(tester.takeException(), isNull);

    // Expand panels: Wearables / Log toggle without layout exceptions.
    await tester.tap(find.text('Wearables'));
    await tester.pumpAndSettle();
    expect(find.text('Wearables'), findsWidgets);
    expect(find.text('Open Tools'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Log'));
    await tester.pumpAndSettle();
    expect(find.text('Quick log'), findsOneWidget);
    expect(find.text('What happened?'), findsOneWidget);
    expect(tester.takeException(), isNull);

    // Meds panel again (accordion).
    await tester.tap(find.text('Meds'));
    await tester.pumpAndSettle();
    expect(find.text("Today's doses"), findsOneWidget);
    expect(find.text('Keppra'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('renders merged empty welcome when no journal entries',
      (tester) async {
    await pumpToday(tester, data: TodayData.empty);

    expect(tester.takeException(), isNull);
    expect(find.text('Start where you are.'), findsOneWidget);
    expect(find.text('Start journaling'), findsOneWidget);
    expect(find.text('TODAY'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('score tiles and signals show empty states when scores missing',
      (tester) async {
    const data = TodayData(
      scores: ScoreSnapshot(hasData: false),
      conditions: ['epilepsy'],
      journalEntryCount: 1,
    );

    await pumpToday(tester, data: data);

    expect(find.text('READINESS'), findsOneWidget);
    expect(find.text('SLEEP'), findsOneWidget);
    expect(find.text('ACTIVITY'), findsOneWidget);
    expect(find.text('YOUR SIGNALS'), findsOneWidget);
    expect(find.text('HRV'), findsOneWidget);
    expect(find.text('Resting HR'), findsOneWidget);
    // Eight Your-signals cells use em dash when scores are missing.
    expect(find.text('—'), findsNWidgets(8));
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
    expect(find.text('Start journaling'), findsOneWidget);
    expect(find.text('TODAY'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
