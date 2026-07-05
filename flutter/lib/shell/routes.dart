import 'package:flutter/foundation.dart';

/// Reads the browser hash/path on web so cold `#/account` links survive startup.
String resolvePlatformInitialLocation({String fallback = AppRoutes.signIn}) {
  if (!kIsWeb) return fallback;

  final fragment = Uri.base.fragment;
  if (fragment.isNotEmpty) {
    final path = fragment.startsWith('/') ? fragment : '/$fragment';
    if (_isKnownAppPath(path)) return path;
  }

  final path = Uri.base.path;
  if (path.isNotEmpty && path != '/' && _isKnownAppPath(path)) {
    return path;
  }

  return fallback;
}

bool _isKnownAppPath(String path) {
  if (path == AppRoutes.signIn) return true;
  return AppRoutes.protectedPaths.any(
    (route) => path == route || path.startsWith('$route/'),
  );
}

/// Public route paths for feature integration.
abstract final class AppRoutes {
  static const signIn = '/sign-in';
  static const marketingHome = '/';
  static const pricing = '/pricing';
  static const marketingPrivacy = '/privacy';
  static const about = '/about';
  static const trust = '/trust';
  static const welcome = '/welcome';
  static const today = '/today';
  static const todayRisk = '/today/risk';
  static const vitals = '/vitals';
  static const seizuresNew = '/seizures/new';
  static const hydration = '/hydration';
  static const journal = '/journal';
  static const journalNew = '/journal/new';
  static const meds = '/meds';
  static const medsHistory = '/meds/history';
  static const settings = '/settings';
  static const account = '/account';
  static const tools = '/tools';
  static const oauthOuraCallback = '/oauth/oura/callback';
  static const oauthWhoopCallback = '/oauth/whoop/callback';
  static const careIndex = '/care';
  static const careInbox = '/care/inbox';
  static const careOwner = '/care/:ownerId';
  static const settingsSharing = '/settings/sharing';
  static const settingsTravel = '/settings/travel';
  static const settingsReports = '/settings/reports';
  static const settingsReportsNew = '/settings/reports/new';

  static const reports = '/reports';
  static const reportsMetrics = '/reports/metrics';
  static const reportsDocuments = '/reports/documents';
  static const reportsMedicalHistory = '/reports/medical-history';
  static const reportsNew = '/reports/new';
  static const reportsNewRedirect = '/reports/new';
  static const reportsRedirect = '/reports';
  static const reportsTrendsPrefix = '/reports/trends/';

  static String reportDetail(String reportId) => '/reports/$reportId';

  static String reportTrend(String metricKey) => '/reports/trends/$metricKey';

  static final _reportIdPattern = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    caseSensitive: false,
  );

  static bool isReportId(String value) => _reportIdPattern.hasMatch(value);

  static const myHealth = '/my-health';
  static const biometrics = '/biometrics';
  static const settingsContact = '/settings/contact';
  static const contact = '/contact';
  static const settingsPrivacy = '/settings/privacy';
  static const settingsHowPurpleThinks = '/settings/how-purple-thinks';
  static const chat = '/chat';
  static const chatCare = '/chat-care';

  static String careDashboard(String ownerId) => '/care/$ownerId';

  static String medDetail(String medId) => '/meds/$medId';

  static String vitalsMetric(String metricKey) => '/vitals/metric/$metricKey';

  static String biometricsMetric(String metricKey) => '/biometrics/$metricKey';

  static const marketingPaths = [
    marketingHome,
    pricing,
    marketingPrivacy,
    about,
    trust,
  ];

  static const protectedPaths = [
    welcome,
    today,
    todayRisk,
    vitals,
    '/vitals/metric/',
    seizuresNew,
    hydration,
    journal,
    journalNew,
    meds,
    medsHistory,
    '/meds/',
    settings,
    account,
    tools,
    oauthOuraCallback,
    oauthWhoopCallback,
    '/care',
    settingsSharing,
    settingsTravel,
    settingsReports,
    settingsReportsNew,
    reports,
    reportsMetrics,
    reportsDocuments,
    reportsMedicalHistory,
    reportsNew,
    reportsTrendsPrefix,
    '/reports/',
    myHealth,
    biometrics,
    '/biometrics/',
    settingsContact,
    contact,
    settingsPrivacy,
    settingsHowPurpleThinks,
    chat,
    chatCare,
  ];
}
