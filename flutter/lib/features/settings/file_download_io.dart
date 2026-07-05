import 'dart:typed_data';

import 'package:path_provider/path_provider.dart';
import 'dart:io';

Future<void> downloadBytes(String filename, Uint8List bytes) async {
  final dir = await getApplicationDocumentsDirectory();
  final file = File('${dir.path}/$filename');
  await file.writeAsBytes(bytes, flush: true);
}
