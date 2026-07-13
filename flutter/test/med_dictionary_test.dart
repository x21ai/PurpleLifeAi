import 'package:flutter_test/flutter_test.dart';

import 'package:purple_app/features/meds/med_dictionary.dart';

void main() {
  group('searchMedDictionary', () {
    test('returns empty for blank query', () {
      expect(searchMedDictionary(''), isEmpty);
      expect(searchMedDictionary('   '), isEmpty);
    });

    test('matches brand alias keppra', () {
      final hits = searchMedDictionary('keppra');
      expect(hits, isNotEmpty);
      expect(hits.first.label, contains('Keppra'));
      expect(hits.first.commonStrengths, isNotNull);
      expect(hits.first.commonStrengths!.first, '250');
      expect(hits.first.defaultUnit, 'mg');
      expect(hits.first.kind, 'medication');
    });

    test('matches partial label', () {
      final hits = searchMedDictionary('lamo');
      expect(hits.any((e) => e.label.contains('Lamotrigine')), isTrue);
    });

    test('respects limit', () {
      final hits = searchMedDictionary('a', limit: 3);
      expect(hits.length, lessThanOrEqualTo(3));
    });
  });

  group('searchUserMedNames', () {
    test('filters by substring', () {
      final hits = searchUserMedNames(
        ['Keppra XR', 'Vitamin D', 'Aspirin'],
        'kep',
      );
      expect(hits, ['Keppra XR']);
    });
  });
}
