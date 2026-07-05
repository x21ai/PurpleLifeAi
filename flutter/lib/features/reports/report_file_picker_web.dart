import 'dart:async';
import 'dart:typed_data';

// ignore: avoid_web_libraries_in_flutter, deprecated_member_use
import 'dart:html' as html;

import 'report_file_picker_stub.dart';

const _accept =
    'application/pdf,image/jpeg,image/png,image/heic,image/webp,.pdf,.jpg,.jpeg,.png,.heic,.webp';
const _maxBytes = 15 * 1024 * 1024;

Future<List<PickedReportFile>> pickReportFiles() async {
  final input = html.FileUploadInputElement()
    ..accept = _accept
    ..multiple = true;

  input.click();

  await input.onChange.first;
  final files = input.files;
  if (files == null || files.isEmpty) return const [];

  final picked = <PickedReportFile>[];
  for (var i = 0; i < files.length; i++) {
    final file = files[i];
    if (file.size > _maxBytes) continue;
    final reader = html.FileReader();
    final completer = Completer<Uint8List>();
    reader.onLoad.listen((_) {
      completer.complete(reader.result as Uint8List);
    });
    reader.readAsArrayBuffer(file);
    final bytes = await completer.future;
    picked.add(
      PickedReportFile(
        name: file.name,
        bytes: bytes,
        mimeType: file.type.isEmpty ? _guessMime(file.name) : file.type,
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
