import 'dart:typed_data';

/// In-memory journal attachment (camera / library pick) before storage upload.
class JournalMediaFile {
  const JournalMediaFile({
    required this.bytes,
    required this.fileName,
    required this.mimeType,
  });

  final Uint8List bytes;
  final String fileName;
  final String mimeType;

  bool get isImage => mimeType.startsWith('image/');
}
