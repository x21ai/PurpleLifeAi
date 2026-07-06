import 'package:flutter_test/flutter_test.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:purple_app/core/config/app_build_info.dart';

void main() {
  setUp(() {
    PackageInfo.setMockInitialValues(
      appName: 'Purple',
      packageName: 'org.purplelife.app',
      version: '1.0.0',
      buildNumber: '24',
      buildSignature: '',
    );
  });

  test('formatBuildDate formats ISO8601', () {
    expect(
      AppBuildInfo.formatBuildDate('2026-07-06T20:26:00Z'),
      'Jul 6, 2026',
    );
  });

  test('formatBuildDate returns Unknown for empty or invalid input', () {
    expect(AppBuildInfo.formatBuildDate(''), 'Unknown');
    expect(AppBuildInfo.formatBuildDate('not-a-date'), 'Unknown');
  });

  test('label uses version, build number, and formatted date', () async {
    final info = await AppBuildInfo.load();
    expect(
      info.copyWith(buildDateRaw: '2026-07-06T20:26:00Z').label,
      'Version 1.0.0 (24) · Jul 6, 2026',
    );
  });
}

extension on AppBuildInfo {
  AppBuildInfo copyWith({String? buildDateRaw}) {
    return AppBuildInfo(
      version: version,
      buildNumber: buildNumber,
      buildDateRaw: buildDateRaw ?? this.buildDateRaw,
    );
  }
}
