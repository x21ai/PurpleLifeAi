import 'dart:io';
import 'dart:typed_data';

import 'package:image_picker/image_picker.dart';

Future<Uint8List> readCapturedBytes(String path) {
  if (path.startsWith('blob:') || path.startsWith('http')) {
    return XFile(path).readAsBytes();
  }
  return File(path).readAsBytes();
}
