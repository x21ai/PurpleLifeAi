import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_state.dart';
import '../features/account/account_screen.dart';
import '../features/auth/sign_in_screen.dart';
import '../features/care/care_dashboard_screen.dart';
import '../features/chat/chat_screen.dart';
import '../features/journal/journal_capture_screen.dart';
import '../features/journal/journal_screen.dart';
import '../features/meds/meds_screen.dart';
import '../features/settings/settings_placeholder_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/today/today_screen.dart';
import '../features/tools/tools_screen.dart';
import '../features/vitals/vitals_screen.dart';
import 'auth_gate.dart';
import 'native_app_shell.dart';
import 'routes.dart';

/// Application router with auth redirect and feature screens wired in.
final routerProvider = Provider<GoRouter>((ref) {
  ref.watch(isAuthenticatedProvider);
  ref.watch(authProvider);

  return GoRouter(
    initialLocation: AppRoutes.signIn,
    redirect: (context, state) => authRedirect(ref, state),
    routes: [
      GoRoute(
        path: AppRoutes.signIn,
        name: 'sign-in',
        builder: (context, state) => const SignInScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => NativeAppShell(
          location: state.uri.path,
          child: AuthGate(child: child),
        ),
        routes: [
          GoRoute(
            path: AppRoutes.today,
            name: 'today',
            builder: (context, state) => const TodayScreen(),
          ),
          GoRoute(
            path: AppRoutes.vitals,
            name: 'vitals',
            builder: (context, state) => const VitalsScreen(),
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
            path: AppRoutes.careOwner,
            name: 'care-dashboard',
            builder: (context, state) {
              final ownerId = state.pathParameters['ownerId'] ?? '';
              return CareDashboardScreen(ownerId: ownerId);
            },
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
            builder: (context, state) => const SettingsPlaceholderScreen(
              title: 'Labs and reports',
              body:
                  'Upload lab PDFs and review AI summaries. Full reports UI ships in a later phase.',
            ),
          ),
          GoRoute(
            path: AppRoutes.settingsContact,
            name: 'settings-contact',
            builder: (context, state) => const SettingsPlaceholderScreen(
              title: 'Contact',
              body: 'Reach the Purple team with questions or feedback.',
            ),
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
});
