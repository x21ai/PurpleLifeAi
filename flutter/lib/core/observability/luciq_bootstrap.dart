import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:luciq_flutter/luciq_flutter.dart';

/// Starts Luciq when [LUCIQ_APP_TOKEN] is passed at compile time.
///
/// Skips web and empty tokens (tests, local analyze). Defers init 1s to match
/// the prior native AppDelegate guard against launch-time SDK work.
Future<void> bootstrapLuciq() async {
  if (kIsWeb) return;

  const token = String.fromEnvironment('LUCIQ_APP_TOKEN');
  if (token.isEmpty || token == r'$(LUCIQ_APP_TOKEN)') {
    return;
  }

  await Future<void>.delayed(const Duration(seconds: 1));

  try {
    await Luciq.init(
      token: token,
      invocationEvents: [InvocationEvent.shake],
    );
  } catch (e, st) {
    if (kDebugMode) {
      debugPrint('Luciq init skipped: $e\n$st');
    }
  }
}
