import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/settings/data_export_service.dart';

void main() {
  test('csvEscape quotes commas and newlines', () {
    expect(csvEscape('hello'), 'hello');
    expect(csvEscape('a,b'), '"a,b"');
    expect(csvEscape('line\nbreak'), '"line\nbreak"');
  });

  test('toCsv builds header and rows', () {
    final csv = toCsv([
      {'a': 1, 'b': 'x'},
      {'a': 2, 'b': 'y'},
    ]);
    expect(csv, contains('a,b'));
    expect(csv, contains('1,x'));
    expect(csv, contains('2,y'));
  });
}
