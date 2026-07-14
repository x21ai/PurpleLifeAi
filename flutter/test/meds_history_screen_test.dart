import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:purple_app/features/meds/meds_history_screen.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/meds/meds_today.dart';
import 'package:purple_app/features/meds/models/dose.dart';
import 'package:purple_app/features/meds/models/medication.dart';
import 'package:purple_app/features/meds/past_dose_sheet.dart';
import 'support/purple_test_theme.dart';

void main() {
  group('MedsHistoryScreen', () {
    const med = Medication(
      id: 'm1',
      name: 'Keppra',
      active: true,
      kind: 'medication',
      isRescue: false,
      dosageAmount: 500,
      dosageUnit: 'mg',
      timesOfDay: ['08:00'],
    );

    final dose = MedicationDose(
      id: 'd1',
      medicationId: 'm1',
      scheduledAt: DateTime.utc(2026, 7, 4, 12),
      status: 'missed',
      amount: 500,
      unit: 'mg',
      medication: med,
    );

    final history = (
      groups: [
        DoseHistoryDay(
          date: '2026-07-04',
          label: 'Saturday, July 4, 2026',
          doses: [dose],
          takenCount: 0,
          total: 1,
        ),
      ],
      timezone: 'UTC',
    );

    testWidgets('renders history and opens edit past dose sheet', (tester) async {
      final router = GoRouter(
        initialLocation: '/meds/history',
        routes: [
          GoRoute(
            path: '/meds',
            builder: (_, __) => const SizedBox(),
            routes: [
              GoRoute(
                path: 'history',
                builder: (_, __) => const MedsHistoryScreen(),
              ),
              GoRoute(
                path: ':medId',
                builder: (_, __) => const SizedBox(),
              ),
            ],
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            doseHistoryProvider.overrideWith((ref) async => history),
            medicationByIdProvider('m1').overrideWith((ref) async => med),
          ],
          child: MaterialApp.router(
            theme: purpleTestTheme(),
            routerConfig: router),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Dose history'), findsOneWidget);
      expect(find.text('Keppra'), findsOneWidget);
      expect(find.text('missed'), findsOneWidget);
      expect(find.text('Could not load dose history.'), findsNothing);

      await tester.tap(find.text('Keppra'));
      await tester.pumpAndSettle();

      expect(find.byType(PastDoseSheet), findsOneWidget);
      expect(find.text('Edit dose'), findsOneWidget);
    });

    testWidgets('empty history is not a blank crash', (tester) async {
      final router = GoRouter(
        initialLocation: '/meds/history',
        routes: [
          GoRoute(
            path: '/meds',
            builder: (_, __) => const SizedBox(),
            routes: [
              GoRoute(
                path: 'history',
                builder: (_, __) => const MedsHistoryScreen(),
              ),
            ],
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            doseHistoryProvider.overrideWith(
              (ref) async => (
                groups: const <DoseHistoryDay>[],
                timezone: 'UTC',
              ),
            ),
          ],
          child: MaterialApp.router(
            theme: purpleTestTheme(),
            routerConfig: router),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('No dose history yet.'), findsOneWidget);
      expect(find.text('Dose history'), findsOneWidget);
    });
  });
}
