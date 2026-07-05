import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/journal/models/journal_entry.dart';

void main() {
  group('JournalEntry pendingUpload', () {
    test('AI processing status does not imply pending upload', () {
      final entry = JournalEntry.fromJson({
        'id': 'entry-1',
        'captured_at': '2026-01-01T12:00:00Z',
        'status': 'processing',
      });

      expect(entry.isProcessing, isTrue);
      expect(entry.pendingUpload, isFalse);
    });

    test('pending upload is explicit, separate from processing UI', () {
      final entry = JournalEntry.fromJson(
        {
          'id': 'entry-2',
          'captured_at': '2026-01-01T12:00:00Z',
          'status': 'processing',
        },
        pendingUpload: true,
      );

      expect(entry.isProcessing, isTrue);
      expect(entry.pendingUpload, isTrue);
    });
  });
}
