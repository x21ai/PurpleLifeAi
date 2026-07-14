import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/today/date_strip.dart';

Finder _tileSizedBox(Finder ofText) {
  return find.ancestor(
    of: ofText,
    matching: find.byWidgetPredicate(
      (w) => w is SizedBox && w.width == 56 && w.height == 72,
    ),
  );
}

void main() {
  testWidgets('selected TODAY tile is full 56x72 (not shrunk)', (tester) async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

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

    final todayTile = _tileSizedBox(find.text('TODAY'));
    expect(todayTile, findsWidgets);
    expect(tester.getSize(todayTile.first), const Size(56, 72));

    final neighborTile = _tileSizedBox(find.text('${yesterday.day}'));
    expect(neighborTile, findsWidgets);
    expect(tester.getSize(neighborTile.first), const Size(56, 72));
  });

  testWidgets('selected off-today tile stays 56x72 with primary ring',
      (tester) async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: DateStrip(
            value: yesterday,
            onChanged: (_) {},
            daysBack: 1,
            daysForward: 1,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Header "Today" pill appears when viewing a past day.
    expect(find.text('Today'), findsOneWidget);

    final selectedTile = _tileSizedBox(find.text('${yesterday.day}'));
    expect(selectedTile, findsWidgets);
    expect(tester.getSize(selectedTile.first), const Size(56, 72));

    final todayTile = _tileSizedBox(find.text('TODAY'));
    expect(todayTile, findsWidgets);
    expect(tester.getSize(todayTile.first), const Size(56, 72));
  });
}
