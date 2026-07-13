import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:purple_app/features/meds/med_detail_screen.dart';
import 'package:purple_app/features/meds/meds_repository.dart';
import 'package:purple_app/features/meds/meds_today.dart';
import 'package:purple_app/features/meds/models/dose.dart';
import 'package:purple_app/features/meds/models/medication.dart';
import 'package:purple_app/features/meds/past_dose_sheet.dart';

void main() {
  group('getDosesForDate parity helpers', () {
    test('past view dates must not regenerate today dose rows', () {
      expect(
        shouldRegenerateTodayDoses(
          viewDateStr: '2026-07-04',
          todayStr: '2026-07-05',
        ),
        isFalse,
      );
      expect(
        shouldRegenerateTodayDoses(
          viewDateStr: '2026-07-05',
          todayStr: '2026-07-05',
        ),
        isTrue,
      );
    });

    test('dayWindowForTimezone returns UTC bounds for a calendar day', () {
      final window = dayWindowForTimezone('UTC', '2026-07-04');
      expect(window.startIso, startsWith('2026-07-04T00:00:00'));
      expect(window.endIso, startsWith('2026-07-04T23:59:59'));
      expect(window.label, isNotEmpty);
    });
  });

  group('buildPastDosePayload', () {
    test('sets taken_at when status is taken', () {
      final when = DateTime.utc(2026, 7, 4, 14, 30);
      final payload = buildPastDosePayload(
        medicationId: 'm1',
        scheduledAt: when,
        status: 'taken',
        amount: 500,
        unit: 'mg',
        includeCreatedByKind: true,
      );
      expect(payload['medication_id'], 'm1');
      expect(payload['status'], 'taken');
      expect(payload['amount'], 500);
      expect(payload['unit'], 'mg');
      expect(payload['taken_at'], when.toIso8601String());
      expect(payload['created_by_kind'], 'user');
    });

    test('clears taken_at for non-taken statuses and normalizes unknown', () {
      final when = DateTime.utc(2026, 7, 4, 14, 30);
      final skipped = buildPastDosePayload(
        medicationId: 'm1',
        scheduledAt: when,
        status: 'skipped',
      );
      expect(skipped['taken_at'], isNull);
      expect(skipped.containsKey('created_by_kind'), isFalse);

      final unknown = buildPastDosePayload(
        medicationId: 'm1',
        scheduledAt: when,
        status: 'weird',
      );
      expect(unknown['status'], 'taken');
      expect(unknown['taken_at'], when.toIso8601String());
    });
  });

  group('MedDetailScreen past dose UI', () {
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
      status: 'taken',
      amount: 500,
      unit: 'mg',
      medication: med,
    );

    testWidgets('shows Add a past dose and opens sheet', (tester) async {
      final router = GoRouter(
        initialLocation: '/meds/m1',
        routes: [
          GoRoute(
            path: '/meds',
            builder: (_, __) => const SizedBox(),
          ),
          GoRoute(
            path: '/meds/history',
            builder: (_, __) => const SizedBox(),
          ),
          GoRoute(
            path: '/meds/:medId',
            builder: (_, __) => const MedDetailScreen(medId: 'm1'),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            medicationByIdProvider('m1').overrideWith((ref) async => med),
            medicationDosesProvider('m1').overrideWith((ref) async => [dose]),
          ],
          child: MaterialApp.router(routerConfig: router),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Add a past dose'), findsOneWidget);
      expect(find.text('Dose history'), findsOneWidget);
      expect(find.text('taken'), findsOneWidget);

      await tester.tap(find.text('Add a past dose'));
      await tester.pumpAndSettle();

      expect(find.byType(PastDoseSheet), findsOneWidget);
      expect(find.text('Save'), findsOneWidget);
    });

    testWidgets('tapping a dose row opens edit sheet', (tester) async {
      final router = GoRouter(
        initialLocation: '/meds/m1',
        routes: [
          GoRoute(
            path: '/meds',
            builder: (_, __) => const SizedBox(),
          ),
          GoRoute(
            path: '/meds/history',
            builder: (_, __) => const SizedBox(),
          ),
          GoRoute(
            path: '/meds/:medId',
            builder: (_, __) => const MedDetailScreen(medId: 'm1'),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            medicationByIdProvider('m1').overrideWith((ref) async => med),
            medicationDosesProvider('m1').overrideWith((ref) async => [dose]),
          ],
          child: MaterialApp.router(routerConfig: router),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('taken'));
      await tester.pumpAndSettle();

      expect(find.byType(PastDoseSheet), findsOneWidget);
      expect(find.text('Edit dose'), findsOneWidget);
    });
  });
}
