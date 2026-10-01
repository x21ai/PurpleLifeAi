import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/today/today_focus_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('normalizeTodayFocus keeps web values and falls back to sleep', () {
    expect(normalizeTodayFocus('readiness'), 'readiness');
    expect(normalizeTodayFocus('sleep'), 'sleep');
    expect(normalizeTodayFocus('activity'), 'activity');
    expect(normalizeTodayFocus('stress'), todayFocusFallback);
    expect(normalizeTodayFocus(null), todayFocusFallback);
  });

  test('read and write today focus through shared preferences', () async {
    SharedPreferences.setMockInitialValues({});
    expect(await readTodayFocus(), todayFocusFallback);
    await writeTodayFocus('readiness');
    expect(await readTodayFocus(), 'readiness');
    await writeTodayFocus('nope');
    expect(await readTodayFocus(), todayFocusFallback);
  });
}
