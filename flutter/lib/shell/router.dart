import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/account/account_screen.dart';
import '../features/auth/reset_password_screen.dart';
import '../features/auth/sign_in_screen.dart';
import '../features/auth/welcome_screen.dart';
import '../features/care/care_accept_screen.dart';
import '../features/care/care_dashboard_screen.dart';
import '../features/care/care_index_screen.dart';
import '../features/care/care_report_screen.dart';
import '../features/care/care_inbox_screen.dart';
import '../features/chat/chat_screen.dart';
import '../features/journal/journal_capture_screen.dart';
import '../features/journal/journal_screen.dart';
import '../features/marketing/marketing_about_screen.dart';
import '../features/marketing/marketing_charter_screen.dart';
import '../features/marketing/marketing_features_screen.dart';
import '../features/marketing/marketing_home_screen.dart';
import '../features/marketing/marketing_pricing_screen.dart';
import '../features/marketing/marketing_privacy_screen.dart';
import '../features/marketing/marketing_terms_screen.dart';
import '../features/marketing/marketing_trust_screen.dart';
import '../features/meds/med_detail_screen.dart';
import '../features/meds/meds_history_screen.dart';
import '../features/meds/meds_screen.dart';
import '../features/reports/reports_detail_screen.dart';
import '../features/reports/reports_documents_screen.dart';
import '../features/reports/reports_medical_history_screen.dart';
import '../features/reports/reports_metrics_screen.dart';
import '../features/reports/reports_trend_screen.dart';
import '../features/reports/reports_upload_screen.dart';
import '../features/settings/contact_screen.dart';
import '../features/settings/how_purple_thinks_screen.dart';
import '../features/settings/privacy_screen.dart';
import '../features/settings/settings_placeholder_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/settings/sharing_screen.dart';
import '../features/settings/terms_screen.dart';
import '../features/hydration/hydration_screen.dart';
import '../features/timeline/timeline_screen.dart';
import '../features/seizures/log_seizure_screen.dart';
import '../features/vitals/biometrics_hub_screen.dart';
import '../features/vitals/metric_detail_screen.dart';
import '../features/ask_maya/ask_maya_screen.dart';
import '../features/data/data_screen.dart';
import '../features/plan/plan_screen.dart';
import '../features/today/today_risk_screen.dart';
import '../features/today/today_screen.dart';
import '../features/tools/tools_screen.dart';
import '../features/tools/wearable_oauth_callback_screen.dart';
import '../features/tools/wearable_oauth.dart';
import '../features/vitals/vitals_screen.dart';
import 'auth_gate.dart';
import 'native_app_shell.dart';
import 'router_refresh.dart';
import 'routes.dart';

/// Application router with auth redirect and feature screens wired in.
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ref.watch(routerRefreshProvider);

  final router = GoRouter(
    initialLocation: resolvePlatformInitialLocation(),
    refreshListenable: refresh,
    redirect: (context, state) => authRedirect(ref, state),
    routes: [
      GoRoute(
        path: AppRoutes.marketingHome,
        name: 'marketing-home',
        builder: (context, state) => const MarketingHomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.pricing,
        name: 'marketing-pricing',
        builder: (context, state) => const MarketingPricingScreen(),
      ),
      GoRoute(
        path: AppRoutes.marketingPrivacy,
        name: 'marketing-privacy',
        builder: (context, state) => const MarketingPrivacyScreen(),
      ),
      GoRoute(
        path: AppRoutes.about,
        name: 'marketing-about',
        builder: (context, state) => const MarketingAboutScreen(),
      ),
      GoRoute(
        path: AppRoutes.trust,
        name: 'marketing-trust',
        builder: (context, state) => const MarketingTrustScreen(),
      ),
      GoRoute(
        path: AppRoutes.features,
        name: 'marketing-features',
        builder: (context, state) => const MarketingFeaturesScreen(),
      ),
      GoRoute(
        path: AppRoutes.charter,
        name: 'marketing-charter',
        builder: (context, state) => const MarketingCharterScreen(),
      ),
      GoRoute(
        path: AppRoutes.terms,
        name: 'marketing-terms',
        builder: (context, state) => const MarketingTermsScreen(),
      ),
      GoRoute(
        path: AppRoutes.signIn,
        name: 'sign-in',
        builder: (context, state) => SignInScreen(
          resetLinkExpired: state.uri.queryParameters['reset'] == 'expired',
        ),
      ),
      GoRoute(
        path: AppRoutes.resetPassword,
        name: 'reset-password',
        builder: (context, state) => const ResetPasswordScreen(),
      ),
      GoRoute(
        path: AppRoutes.oauthOuraCallback,
        name: 'oauth-oura-callback',
        builder: (context, state) => const WearableOAuthCallbackScreen(
          provider: WearableOAuthProvider.oura,
        ),
      ),
      GoRoute(
        path: AppRoutes.oauthWhoopCallback,
        name: 'oauth-whoop-callback',
        builder: (context, state) => const WearableOAuthCallbackScreen(
          provider: WearableOAuthProvider.whoop,
        ),
      ),
      ShellRoute(
        builder: (context, state, child) => NativeAppShell(
          location: state.uri.path,
          child: AuthGate(child: child),
        ),
        routes: [
          GoRoute(
            path: AppRoutes.welcome,
            name: 'welcome',
            builder: (context, state) => const WelcomeScreen(),
          ),
          GoRoute(
            path: AppRoutes.today,
            name: 'today',
            builder: (context, state) => const TodayScreen(),
            routes: [
              GoRoute(
                path: 'risk',
                name: 'today-risk',
                builder: (context, state) => const TodayRiskScreen(),
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.data,
            name: 'data',
            builder: (context, state) => const DataScreen(),
          ),
          GoRoute(
            path: AppRoutes.plan,
            name: 'plan',
            builder: (context, state) {
              final segment = state.uri.queryParameters['segment'];
              final initial = segment == 'recommended'
                  ? PlanSegment.recommended
                  : PlanSegment.protocol;
              return PlanScreen(initialSegment: initial);
            },
          ),
          GoRoute(
            path: AppRoutes.askMaya,
            name: 'ask-maya',
            builder: (context, state) => const AskMayaScreen(),
          ),
          GoRoute(
            path: AppRoutes.myHealth,
            name: 'my-health',
            redirect: (context, state) => AppRoutes.data,
          ),
          GoRoute(
            path: AppRoutes.insights,
            name: 'insights',
            redirect: (context, state) => AppRoutes.plan,
          ),
          GoRoute(
            path: AppRoutes.timeline,
            name: 'timeline',
            builder: (context, state) => const TimelineScreen(),
          ),
          GoRoute(
            path: AppRoutes.biometrics,
            name: 'biometrics',
            builder: (context, state) => const BiometricsHubScreen(),
            routes: [
              GoRoute(
                path: ':metricKey',
                name: 'biometrics-metric',
                builder: (context, state) {
                  final metricKey = state.pathParameters['metricKey'] ?? '';
                  return MetricDetailScreen(metricKey: metricKey);
                },
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.vitals,
            name: 'vitals',
            builder: (context, state) => const VitalsScreen(),
            routes: [
              GoRoute(
                path: 'metric/:metricKey',
                name: 'vitals-metric',
                builder: (context, state) {
                  final metricKey = state.pathParameters['metricKey'] ?? '';
                  return MetricDetailScreen(metricKey: metricKey);
                },
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.seizuresNew,
            name: 'seizures-new',
            builder: (context, state) => const LogSeizureScreen(),
          ),
          GoRoute(
            path: AppRoutes.hydration,
            name: 'hydration',
            builder: (context, state) => const HydrationScreen(),
          ),
          GoRoute(
            path: AppRoutes.journal,
            name: 'journal',
            builder: (context, state) => const JournalScreen(),
          ),
          GoRoute(
            path: AppRoutes.journalNew,
            name: 'journal-new',
            builder: (context, state) => const JournalCaptureScreen(),
          ),
          GoRoute(
            path: AppRoutes.meds,
            name: 'meds',
            builder: (context, state) => const MedsScreen(),
            routes: [
              GoRoute(
                path: 'history',
                name: 'meds-history',
                builder: (context, state) => const MedsHistoryScreen(),
              ),
              GoRoute(
                path: ':medId',
                name: 'med-detail',
                builder: (context, state) {
                  final medId = state.pathParameters['medId'] ?? '';
                  return MedDetailScreen(medId: medId);
                },
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.settings,
            name: 'settings',
            builder: (context, state) => const SettingsScreen(),
          ),
          GoRoute(
            path: AppRoutes.account,
            name: 'account',
            builder: (context, state) => const AccountScreen(),
          ),
          GoRoute(
            path: AppRoutes.tools,
            name: 'tools',
            builder: (context, state) => const ToolsScreen(),
          ),
          GoRoute(
            path: '/care',
            name: 'care',
            builder: (context, state) => const CareIndexScreen(),
          ),
          GoRoute(
            path: AppRoutes.careInbox,
            name: 'care-inbox',
            builder: (context, state) => const CareInboxScreen(),
          ),
          GoRoute(
            path: AppRoutes.careAccept,
            name: 'care-accept',
            builder: (context, state) => CareAcceptScreen(
              token: state.uri.queryParameters['token'],
            ),
          ),
          GoRoute(
            path: AppRoutes.careOwner,
            name: 'care-dashboard',
            builder: (context, state) {
              final ownerId = state.pathParameters['ownerId'] ?? '';
              return CareDashboardScreen(ownerId: ownerId);
            },
            routes: [
              GoRoute(
                path: 'reports/:reportId',
                name: 'care-report',
                builder: (context, state) {
                  final ownerId = state.pathParameters['ownerId'] ?? '';
                  final reportId = state.pathParameters['reportId'] ?? '';
                  return CareReportScreen(
                    ownerId: ownerId,
                    reportId: reportId,
                  );
                },
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.settingsSharing,
            name: 'settings-sharing',
            builder: (context, state) => const SharingScreen(),
          ),
          GoRoute(
            path: AppRoutes.settingsTravel,
            name: 'settings-travel',
            builder: (context, state) => const SettingsPlaceholderScreen(
              title: 'Travel',
              body:
                  'Trip mode and time zone overrides for medication reminders ship in a later phase.',
            ),
          ),
          GoRoute(
            path: AppRoutes.settingsReports,
            name: 'settings-reports',
            redirect: (context, state) => AppRoutes.reportsMetrics,
          ),
          GoRoute(
            path: AppRoutes.settingsReportsNew,
            name: 'settings-reports-new',
            redirect: (context, state) => AppRoutes.reportsNew,
          ),
          GoRoute(
            path: AppRoutes.reports,
            name: 'reports',
            redirect: (context, state) {
              if (state.uri.path == AppRoutes.reports) {
                return AppRoutes.reportsMetrics;
              }
              return null;
            },
            routes: [
              GoRoute(
                path: 'metrics',
                name: 'reports-metrics',
                builder: (context, state) => const ReportsMetricsScreen(),
              ),
              GoRoute(
                path: 'documents',
                name: 'reports-documents',
                builder: (context, state) => const ReportsDocumentsScreen(),
              ),
              GoRoute(
                path: 'medical-history',
                name: 'reports-medical-history',
                builder: (context, state) =>
                    const ReportsMedicalHistoryScreen(),
              ),
              GoRoute(
                path: 'new',
                name: 'reports-new',
                builder: (context, state) => const ReportsUploadScreen(),
              ),
              GoRoute(
                path: 'trends/:metricKey',
                name: 'reports-trend',
                builder: (context, state) {
                  final metricKey = state.pathParameters['metricKey']!;
                  return ReportsTrendScreen(metricKey: metricKey);
                },
              ),
              GoRoute(
                path: ':reportId',
                name: 'reports-detail',
                builder: (context, state) {
                  final reportId = state.pathParameters['reportId']!;
                  return ReportsDetailScreen(reportId: reportId);
                },
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.settingsContact,
            name: 'settings-contact',
            redirect: (context, state) => AppRoutes.contact,
          ),
          GoRoute(
            path: AppRoutes.contact,
            name: 'contact',
            builder: (context, state) => const ContactScreen(),
          ),
          GoRoute(
            path: AppRoutes.settingsPrivacy,
            name: 'settings-privacy',
            builder: (context, state) => const PrivacyScreen(),
          ),
          GoRoute(
            path: AppRoutes.settingsTerms,
            name: 'settings-terms',
            builder: (context, state) => const TermsScreen(),
          ),
          GoRoute(
            path: AppRoutes.settingsHowPurpleThinks,
            name: 'settings-how-purple-thinks',
            builder: (context, state) => const HowPurpleThinksScreen(),
          ),
          GoRoute(
            path: AppRoutes.chat,
            name: 'chat',
            builder: (context, state) {
              final query = state.uri.queryParameters['q'];
              return ChatScreen(initialQuery: query);
            },
          ),
          GoRoute(
            path: AppRoutes.chatCare,
            name: 'chat-care',
            builder: (context, state) {
              final threadId = state.uri.queryParameters['thread'];
              return ChatCareScreen(threadId: threadId);
            },
          ),
        ],
      ),
    ],
  );

  ref.onDispose(router.dispose);
  return router;
});
