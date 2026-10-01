import 'dart:typed_data';

/// How a journal attachment is stored and labeled.
enum JournalMediaKind { photo, video, voice }

/// In-memory journal attachment before storage upload.
class JournalMediaFile {
  const JournalMediaFile({
    required this.bytes,
    required this.fileName,
    required this.mimeType,
    this.kind = JournalMediaKind.photo,
  });

  final Uint8List bytes;
  final String fileName;
  final String mimeType;
  final JournalMediaKind kind;

  bool get isImage =>
      kind == JournalMediaKind.photo || mimeType.startsWith('image/');
}

/// Mirrors web `inferKind`: text, voice, and other media are separate types.
/// More than one type is `mixed`.
String journalEntryKind({
  required String text,
  required List<JournalMediaFile> media,
}) {
  final hasText = text.trim().isNotEmpty;
  final hasVoice = media.any((file) => file.kind == JournalMediaKind.voice);
  final hasOtherMedia = media.any(
    (file) =>
        file.kind == JournalMediaKind.photo ||
        file.kind == JournalMediaKind.video,
  );
  final typeCount = [hasText, hasVoice, hasOtherMedia].where((v) => v).length;
  if (typeCount > 1) return 'mixed';
  if (hasVoice) return 'voice';
  if (media.any((file) => file.kind == JournalMediaKind.video)) return 'video';
  if (hasOtherMedia) return 'photo';
  return 'text';
}

/// Storage object prefix (`photo-`, `video-`, `voice-`) so journal cards can
/// tell clips apart inside a signed URL.
String journalMediaStoragePrefix(JournalMediaKind kind) {
  switch (kind) {
    case JournalMediaKind.video:
      return 'video';
    case JournalMediaKind.voice:
      return 'voice';
    case JournalMediaKind.photo:
      return 'photo';
  }
}

String journalMediaExtension(JournalMediaFile file) {
  final fromName = file.fileName.split('.').last.toLowerCase();
  if (fromName.isNotEmpty &&
      fromName.length <= 5 &&
      fromName != file.fileName.toLowerCase()) {
    return fromName;
  }
  final mime = file.mimeType.toLowerCase();
  if (mime.contains('png')) return 'png';
  if (mime.contains('webp')) return 'webp';
  if (mime.contains('heic')) return 'heic';
  if (mime.contains('webm')) return 'webm';
  if (mime.contains('quicktime')) return 'mov';
  if (mime.contains('mp4') && file.kind == JournalMediaKind.voice) return 'm4a';
  if (mime.contains('mp4') || mime.contains('video')) return 'mp4';
  if (mime.contains('mpeg') || mime.contains('mp3')) return 'mp3';
  if (mime.contains('aac')) return 'aac';
  if (file.kind == JournalMediaKind.voice) return 'm4a';
  if (file.kind == JournalMediaKind.video) return 'mp4';
  return 'jpg';
}
