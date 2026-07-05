import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/timeline/timeline_screen.dart';
import 'package:purple_app/shell/routes.dart';

void main() {
  group('insights and timeline routes', () {
    test('insights is a protected path', () {
      expect(AppRoutes.protectedPaths.contains(AppRoutes.insights), isTrue);
      expect(AppRoutes.insights, '/insights');
    });

    test('timeline is a protected path', () {
      expect(AppRoutes.protectedPaths.contains(AppRoutes.timeline), isTrue);
      expect(AppRoutes.timeline, '/timeline');
    });

    test('timeline week query starts on Monday', () {
      final query = timelineQueryForRange(range: TimelineRange.week);
      expect(query.since.weekday, DateTime.monday);
    });
  });
}
