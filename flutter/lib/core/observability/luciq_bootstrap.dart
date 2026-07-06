import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:luciq_flutter/luciq_flutter.dart';

bool _luciqInitialized = false;
Future<void>? _bootstrapFuture;

/// Shake plus screenshot capture (screenshot is more reliable on iOS TF).
const List<InvocationEvent> luciqInvocationEvents = [
  InvocationEvent.shake,
  InvocationEvent.screenshot,
];

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
/// Skips web and empty tokens (tests, local analyze). Runs before [runApp] so
/// shake and manual report are ready on first frame.
Future<void> bootstrapLuciq() {
  if (_bootstrapFuture != null) return _bootstrapFuture!;
  _bootstrapFuture = _bootstrapLuciqImpl();
  return _bootstrapFuture!;
}

Future<void> _bootstrapLuciqImpl() async {
  if (kIsWeb) return;

  const token = String.fromEnvironment('LUCIQ_APP_TOKEN');
  if (token.isEmpty || token == r'$(LUCIQ_APP_TOKEN)') {
    return;
  }

  try {
    await Luciq.init(
      token: token,
      invocationEvents: luciqInvocationEvents,
      debugLogsLevel: LogLevel.error,
    );
    await Luciq.setEnabled(true);
    await BugReporting.setEnabled(true);
    await BugReporting.setInvocationEvents(luciqInvocationEvents);
    _luciqInitialized = true;
    luciqInitNotifier.value = true;
    // Non-sensitive marker visible in Luciq dashboard user attributes.
    unawaited(Luciq.setUserAttribute('ok', 'luciq_bootstrap'));
    debugPrint('Luciq bootstrap ok');
  } catch (e, st) {
    _luciqInitialized = false;
    luciqInitNotifier.value = false;
    debugPrint('Luciq bootstrap failed: $e');
    if (kDebugMode) {
      debugPrint('$st');
    }
  }
}

/// Opens the Luciq bug-report UI when the SDK is active (shake alternative).
Future<void> showLuciqReport() async {
  if (kIsWeb || !luciqReportConfigured()) return;
  if (!luciqReportAvailable()) {
    await bootstrapLuciq();
  }
  if (!luciqReportAvailable()) return;
  try {
    await Luciq.show();
  } catch (e, st) {
    debugPrint('Luciq show failed: $e');
    if (kDebugMode) {
      debugPrint('$st');
    }
  }
}
