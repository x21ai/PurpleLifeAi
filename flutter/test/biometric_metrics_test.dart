import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/vitals/biometric_metrics.dart';

void main() {
  group('biometric metadata', () {
    test('metricOrder has all 18 keys and each resolves to metadata', () {
      expect(metricOrder.length, 18);
      for (final key in metricOrder) {
        final meta = biometricMetricForKey(key);
        expect(meta, isNotNull, reason: '$key should have metadata');
        expect(meta!.column, isNotEmpty);
        expect(metricCategory.containsKey(key), isTrue);
      }
    });

    test('every category has a label', () {
      for (final c in categoryOrder) {
        expect(categoryLabel[c], isNotNull);
      }
    });
  });

  group('computeStats', () {
    test('empty → null mean/stddev', () {
      final s = computeStats(const <double?>[]);
      expect(s.mean, isNull);
      expect(s.stddev, isNull);
      expect(s.count, 0);
    });

    test('population stddev (÷n) and ignores nulls', () {
      final s = computeStats(const [2.0, 4.0, null, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]);
      expect(s.count, 8);
      expect(s.mean, closeTo(5.0, 1e-9));
      expect(s.stddev, closeTo(2.0, 1e-9)); // known population sd = 2
    });
  });

  group('classifyValue', () {
    final hrv = biometricMetricForKey('hrv')!; // higher_better

    test('unknown when baseline missing', () {
      expect(classifyValue(hrv, 50, MetricStats.empty), MetricStatus.unknown);
    });

    test('within 1 sd → in_range', () {
      const baseline = MetricStats(mean: 50, stddev: 10, count: 20);
      expect(classifyValue(hrv, 55, baseline), MetricStatus.inRange);
    });

    test('z>1 → high, z<-1 → low', () {
      const baseline = MetricStats(mean: 50, stddev: 10, count: 20);
      expect(classifyValue(hrv, 65, baseline), MetricStatus.high);
      expect(classifyValue(hrv, 35, baseline), MetricStatus.low);
    });

    test('sd floored at mean*0.05', () {
      const baseline = MetricStats(mean: 100, stddev: 0, count: 20);
      // sd floor = 5; value 104 → z=0.8 in range; 106 → z=1.2 high.
      expect(classifyValue(hrv, 104, baseline), MetricStatus.inRange);
      expect(classifyValue(hrv, 106, baseline), MetricStatus.high);
    });
  });

  group('isAttention', () {
    test('higher_better attention only on low', () {
      final m = biometricMetricForKey('hrv')!;
      expect(isAttention(m, MetricStatus.low), isTrue);
      expect(isAttention(m, MetricStatus.high), isFalse);
    });

    test('lower_better attention only on high', () {
      final m = biometricMetricForKey('resting_hr')!;
      expect(isAttention(m, MetricStatus.high), isTrue);
      expect(isAttention(m, MetricStatus.low), isFalse);
    });

    test('neutral attention on any out-of-range', () {
      final m = biometricMetricForKey('respiratory_rate')!;
      expect(isAttention(m, MetricStatus.high), isTrue);
      expect(isAttention(m, MetricStatus.low), isTrue);
      expect(isAttention(m, MetricStatus.inRange), isFalse);
    });
  });

  group('format helpers', () {
    test('hm converts minutes', () {
      expect(biometricMetricForKey('sleep_total')!.format(450), '7h 30m');
      expect(biometricMetricForKey('sleep_total')!.format(420), '7h');
      expect(biometricMetricForKey('sleep_total')!.format(null), '–');
    });

    test('temp deviation sign', () {
      final f = biometricMetricForKey('temp_deviation')!.format;
      expect(f(0.3), '+0.3°C');
      expect(f(-0.2), '-0.2°C');
      expect(f(null), '–');
    });

    test('steps thousands separator', () {
      expect(biometricMetricForKey('steps')!.format(8421), '8,421');
    });
  });

  group('compare lookback (§8)', () {
    test('none/previous/year_ago windows', () {
      expect(lookbackDaysForCompare(30, CompareMode.none), 30);
      expect(lookbackDaysForCompare(30, CompareMode.previous), 60);
      expect(lookbackDaysForCompare(30, CompareMode.yearAgo), 395);
    });
  });
}
