/// Public route paths for feature integration.
abstract final class AppRoutes {
  static const signIn = '/sign-in';
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
  static const careOwner = '/care/:ownerId';
  static const settingsSharing = '/settings/sharing';
  static const settingsTravel = '/settings/travel';
  static const settingsReports = '/settings/reports';
  static const reportsRedirect = '/reports';
  static const settingsContact = '/settings/contact';
  static const contact = '/contact';
  static const settingsPrivacy = '/settings/privacy';
  static const settingsHowPurpleThinks = '/settings/how-purple-thinks';
  static const chat = '/chat';
  static const chatCare = '/chat-care';

  static String careDashboard(String ownerId) => '/care/$ownerId';

  static String medDetail(String medId) => '/meds/$medId';

  static String vitalsMetric(String metricKey) => '/vitals/metric/$metricKey';

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
    reportsRedirect,
    settingsContact,
    contact,
    settingsPrivacy,
    settingsHowPurpleThinks,
    chat,
    chatCare,
  ];
}
