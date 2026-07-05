import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/hydration/hydration_repository.dart';
import 'package:purple_app/features/today/risk_forecast_repository.dart';

void main() {
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
