import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/journal/journal_media_file.dart';

void main() {
  JournalMediaFile file(JournalMediaKind kind) {
    return JournalMediaFile(
      bytes: Uint8List.fromList(const [1]),
      fileName: 'clip.bin',
      mimeType: 'application/octet-stream',
      kind: kind,
    );
  }

  test('journal entry kind matches web text, voice, video, and mixed', () {
    expect(
      journalEntryKind(text: 'hello', media: const []),
      'text',
    );
    expect(
      journalEntryKind(text: '', media: [file(JournalMediaKind.voice)]),
      'voice',
    );
    expect(
      journalEntryKind(text: '', media: [file(JournalMediaKind.video)]),
      'video',
    );
    expect(
      journalEntryKind(text: 'note', media: [file(JournalMediaKind.photo)]),
      'mixed',
    );
    expect(
      journalEntryKind(
        text: '',
        media: [file(JournalMediaKind.voice), file(JournalMediaKind.video)],
      ),
      'mixed',
    );
  });

  test('storage prefix marks voice and video objects', () {
    expect(journalMediaStoragePrefix(JournalMediaKind.voice), 'voice');
    expect(journalMediaStoragePrefix(JournalMediaKind.video), 'video');
    expect(
      journalMediaExtension(
        JournalMediaFile(
          bytes: Uint8List.fromList(const [1]),
          fileName: 'voice-note.m4a',
          mimeType: 'audio/mp4',
          kind: JournalMediaKind.voice,
        ),
      ),
      'm4a',
    );
  });
}
