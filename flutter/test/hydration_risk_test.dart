import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/hydration/electrolyte_presets.dart';
import 'package:purple_app/features/hydration/hydration_repository.dart';
import 'package:purple_app/features/hydration/quick_add_water.dart';
import 'package:purple_app/features/today/risk_forecast_repository.dart';

void main() {
  group('ElectrolytePreset', () {
    test('matches web preset brands and LMNT defaults', () {
      expect(kElectrolytePresets, isNotEmpty);
      expect(
        kElectrolytePresets.map((p) => p.brand).toList(),
        containsAll([
          'LMNT',
          'Liquid I.V.',
          'Pedialyte',
          'Nuun',
          'Gatorade',
          'Coconut water',
          'Pinch of salt',
        ]),
      );
      final lmnt = kElectrolytePresets.firstWhere((p) => p.brand == 'LMNT');
      expect(lmnt.sodiumMg, 1000);
      expect(lmnt.defaultVolumeMl, 500);
    });

    test('quick water amounts match web QUICK_AMOUNTS', () {
      expect(kQuickWaterAmountsMl, [200, 250, 330, 500, 750]);
    });
  });

  group('HydrationRow', () {
    test('parses intake row from Supabase map', () {
      final row = HydrationRow.fromMap({
        'id': 'abc',
        'consumed_at': '2026-07-04T14:30:00.000Z',
        'volume_ml': 250,
        'kind': 'water',
      });
      expect(row.volumeMl, 250);
      expect(row.kind, 'water');
      expect(row.displayLabel, 'Water');
    });

    test('labels electrolyte brand when present', () {
      final row = HydrationRow.fromMap({
        'id': 'abc',
        'consumed_at': '2026-07-04T14:30:00.000Z',
        'volume_ml': 355,
        'kind': 'electrolyte',
        'electrolyte_brand': 'LMNT',
      });
      expect(row.displayLabel, 'LMNT');
    });

    test('handles null consumed_at without null-check crash', () {
      final row = HydrationRow.fromMap({
        'id': 'abc',
        'consumed_at': null,
        'volume_ml': 100,
        'kind': 'water',
      });
      expect(row.volumeMl, 100);
      expect(row.id, 'abc');
    });
  });

  group('HydrationDayData', () {
    test('sums total ml and progress', () {
      final data = HydrationDayData(
        goalMl: 2000,
        isOffline: false,
        rows: [
          HydrationRow(
            id: '1',
            consumedAt: DateTime(2026, 7, 4, 10),
            volumeMl: 500,
            kind: 'water',
          ),
          HydrationRow(
            id: '2',
            consumedAt: DateTime(2026, 7, 4, 12),
            volumeMl: 250,
            kind: 'water',
          ),
        ],
      );
      expect(data.totalMl, 750);
      expect(data.progress, closeTo(0.375, 0.001));
    });

    test('progress clamps at 1.0 when over goal', () {
      final data = HydrationDayData(
        goalMl: 2000,
        isOffline: false,
        rows: [
          HydrationRow(
            id: '1',
            consumedAt: DateTime(2026, 7, 4, 10),
            volumeMl: 3000,
            kind: 'water',
          ),
        ],
      );
      expect(data.progress, 1.0);
    });

    test('progress is 0 when goal is 0', () {
      final data = HydrationDayData(
        goalMl: 0,
        isOffline: false,
        rows: [
          HydrationRow(
            id: '1',
            consumedAt: DateTime(2026, 7, 4, 10),
            volumeMl: 250,
            kind: 'water',
          ),
        ],
      );
      expect(data.progress, 0.0);
    });
  });

  group('QuickAddWater', () {
    ThemeData noSparkleTheme() => ThemeData(
          useMaterial3: true,
          splashFactory: NoSplash.splashFactory,
        );

    testWidgets('renders 250 / 500 / Water / Electrolytes actions',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            theme: noSparkleTheme(),
            home: const Scaffold(body: QuickAddWater()),
          ),
        ),
      );
      expect(find.text('250 ml'), findsOneWidget);
      expect(find.text('500 ml'), findsOneWidget);
      expect(find.text('Water'), findsOneWidget);
      expect(find.text('Electrolytes'), findsOneWidget);
    });

    testWidgets('Water dialog exposes quick amounts and Add', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            theme: noSparkleTheme(),
            home: const Scaffold(body: QuickAddWater()),
          ),
        ),
      );
      await tester.tap(find.text('Water'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Add water'), findsOneWidget);
      for (final ml in kQuickWaterAmountsMl) {
        expect(find.text('$ml ml'), findsWidgets);
      }
      expect(find.text('Add'), findsOneWidget);
      expect(find.text('Cancel'), findsOneWidget);
    });
  });

  group('RiskForecast', () {
    test('parses forecast with factors list', () {
      final forecast = RiskForecast.fromMap({
        'risk_score': 18,
        'band': 'moderate',
        'ai_narrative': 'Steady day.',
        'top_factors': [
          {
            'key': 'sleep',
            'label': 'Sleep debt',
            'detail': 'Below your baseline.',
            'weight': 3,
          },
        ],
        'model_version': 'v1',
        'computed_at': '2026-07-04T18:00:00.000Z',
        'for_date': '2026-07-04',
      });
      expect(forecast.readinessScore, 82);
      expect(forecast.topFactors, hasLength(1));
      expect(forecast.topFactors.first.label, 'Sleep debt');
    });
  });
}
