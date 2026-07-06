import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:luciq_flutter/luciq_flutter.dart';

bool _luciqInitialized = false;

/// Notifies when [bootstrapLuciq] finishes so Settings can show the report row.
final ValueNotifier<bool> luciqInitNotifier = ValueNotifier<bool>(false);

/// Compile-time gate: native TF builds pass `LUCIQ_APP_TOKEN`.
bool luciqReportConfigured() {
  if (kIsWeb) return false;
  const token = String.fromEnvironment('LUCIQ_APP_TOKEN');
  return token.isNotEmpty && token != r'$(LUCIQ_APP_TOKEN)';
}

/// True after [bootstrapLuciq] successfully calls [Luciq.init].
bool luciqReportAvailable() => luciqReportConfigured() && _luciqInitialized;

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
    _luciqInitialized = true;
    luciqInitNotifier.value = true;
  } catch (e, st) {
    if (kDebugMode) {
      debugPrint('Luciq init skipped: $e\n$st');
    }
  }
}

/// Opens the Luciq bug-report UI when the SDK is active (shake alternative).
Future<void> showLuciqReport() async {
  if (kIsWeb || !luciqReportAvailable()) return;
  try {
    await Luciq.show();
  } catch (e, st) {
    if (kDebugMode) {
      debugPrint('Luciq show skipped: $e\n$st');
    }
  }
}
