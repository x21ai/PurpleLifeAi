import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/observability/luciq_bootstrap.dart';
import 'design/tokens.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  unawaited(bootstrapLuciq());
  await PurpleTokens.load();
  runApp(const ProviderScope(child: PurpleApp()));
}
