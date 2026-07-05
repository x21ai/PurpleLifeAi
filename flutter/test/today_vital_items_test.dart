import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/today/models/score_snapshot.dart';

void main() {
  test('buildTodayVitalItems omits null metrics and keeps units', () {
    const snapshot = ScoreSnapshot(
      readiness: 82,
      sleepScore: 76,
      hrvMs: 52,
      restingHr: 58,
      spo2: 97,
      hasData: true,
    );

    final items = buildTodayVitalItems(snapshot);

    expect(items.map((i) => i.key).toList(),
        ['readiness', 'sleep', 'hrv', 'rhr', 'spo2']);
    expect(items.firstWhere((i) => i.key == 'hrv').unit, 'ms');
    expect(items.firstWhere((i) => i.key == 'rhr').unit, 'bpm');
  });

  test('empty snapshot yields no vital tiles', () {
    expect(buildTodayVitalItems(ScoreSnapshot.empty), isEmpty);
  });
}
