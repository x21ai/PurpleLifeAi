import 'package:intl/intl.dart';
import 'package:package_info_plus/package_info_plus.dart';

/// Compile-time build stamp from `--dart-define=BUILD_DATE=ISO8601`.
const buildDateFromEnvironment = String.fromEnvironment('BUILD_DATE');

/// User-facing app version label, e.g. `Version 1.0.0 (23) · Jul 6, 2026`.
class AppBuildInfo {
  const AppBuildInfo({
    required this.version,
    required this.buildNumber,
    required this.buildDateRaw,
  });

  final String version;
  final String buildNumber;
  final String buildDateRaw;

  static Future<AppBuildInfo> load() async {
    final info = await PackageInfo.fromPlatform();
    return AppBuildInfo(
      version: info.version,
      buildNumber: info.buildNumber,
      buildDateRaw: buildDateFromEnvironment,
    );
  }

  String get label =>
      'Version $version ($buildNumber) · ${formatBuildDate(buildDateRaw)}';

  static String formatBuildDate(String raw) {
    if (raw.isEmpty) return 'Unknown';
    try {
      final parsed = DateTime.parse(raw).toLocal();
      return DateFormat('MMM d, yyyy').format(parsed);
    } catch (_) {
      return 'Unknown';
    }
  }
}
