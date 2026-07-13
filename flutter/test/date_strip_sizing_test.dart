import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/today/date_strip.dart';

void main() {
  testWidgets('selected TODAY tile is full 56x72 (not shrunk)', (tester) async {
    final today = DateTime(2026, 7, 12);
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: DateStrip(
            value: today,
            onChanged: (_) {},
            daysBack: 1,
            daysForward: 1,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('TODAY'), findsOneWidget);

    final todayTile = find.ancestor(
      of: find.text('TODAY'),
      matching: find.byWidgetPredicate(
        (w) => w is SizedBox && w.width == 56 && w.height == 72,
      ),
    );
    expect(todayTile, findsWidgets);
    expect(tester.getSize(todayTile.first), const Size(56, 72));

    final neighborTile = find.ancestor(
      of: find.text('11'),
      matching: find.byWidgetPredicate(
        (w) => w is SizedBox && w.width == 56 && w.height == 72,
      ),
    );
    expect(neighborTile, findsWidgets);
    expect(tester.getSize(neighborTile.first), const Size(56, 72));
  });
}
