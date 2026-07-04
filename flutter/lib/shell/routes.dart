/// Public route paths for feature integration.
abstract final class AppRoutes {
  static const signIn = '/sign-in';
  static const today = '/today';
  static const vitals = '/vitals';
  static const journal = '/journal';
  static const journalNew = '/journal/new';
  static const meds = '/meds';
  static const settings = '/settings';
  static const account = '/account';
  static const tools = '/tools';
  static const careOwner = '/care/:ownerId';
  static const settingsSharing = '/settings/sharing';
  static const settingsTravel = '/settings/travel';
  static const settingsReports = '/settings/reports';
  static const settingsContact = '/settings/contact';
  static const chat = '/chat';
  static const chatCare = '/chat-care';

  static String careDashboard(String ownerId) => '/care/$ownerId';

  static const protectedPaths = [
    today,
    vitals,
    journal,
    journalNew,
    meds,
    settings,
    account,
    tools,
    '/care',
    settingsSharing,
    settingsTravel,
    settingsReports,
    settingsContact,
    chat,
    chatCare,
  ];
}
