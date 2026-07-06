export 'report_file_picker_stub.dart';

import 'dart:io';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';

import 'report_file_picker_stub.dart';

const _maxBytes = 15 * 1024 * 1024;
const _allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];

/// Native (iOS/Android/desktop) report picker via `file_picker`. Mirrors the
/// web `<input accept="application/pdf,image/*">` (reports_upload_screen web
/// parity): PDF or photo, capped at 15 MB per file.
Future<List<PickedReportFile>> pickReportFiles() async {
  final result = await FilePicker.pickFiles(
    type: FileType.custom,
    allowedExtensions: _allowedExtensions,
    allowMultiple: true,
    withData: true,
  );
  if (result == null) return const [];

  final picked = <PickedReportFile>[];
  for (final file in result.files) {
    Uint8List? bytes = file.bytes;
    if (bytes == null && file.path != null) {
      bytes = await File(file.path!).readAsBytes();
    }
    if (bytes == null || bytes.length > _maxBytes) continue;
    picked.add(
      PickedReportFile(
        name: file.name,
        bytes: bytes,
        mimeType: _guessMime(file.name),
      ),
    );
  }
  return picked;
}

String _guessMime(String name) {
  final lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}
