import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:purple_app/features/auth/sign_in_screen.dart';
import 'package:purple_app/core/auth/auth_repository.dart';
import 'package:purple_app/core/providers/core_providers.dart';
import 'package:purple_app/core/config/app_config.dart';
import 'package:purple_app/shell/routes.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const testConfig = AppConfig(
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJpYXQiOjE2NDExMDg5NjAsImV4cCI6MTk1NjY4NDk2MH0.test',
  siteUrl: 'https://example.com',
  workerApiBaseUrl: 'https://example.com/api',
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('forgot password link renders', (tester) async {
    tester.view.physicalSize = const Size(800, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
    SharedPreferences.setMockInitialValues({});
    try {
      await Supabase.initialize(
        url: testConfig.supabaseUrl,
        anonKey: testConfig.supabaseAnonKey,
        authOptions: const FlutterAuthClientOptions(
          authFlowType: AuthFlowType.pkce,
          autoRefreshToken: false,
        ),
      );
    } on AssertionError {
      // Already initialized in this isolate.
    }
    await Supabase.instance.client.auth.signOut();
    final authRepo = AuthRepository(config: testConfig);

    final router = GoRouter(
      routes: [
        GoRoute(
          path: AppRoutes.signIn,
          builder: (context, state) => const SignInScreen(),
        ),
      ],
      initialLocation: AppRoutes.signIn,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(testConfig),
          authRepositoryProvider.overrideWith((ref) async => authRepo),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Forgot password?'), findsOneWidget);
  });
}
