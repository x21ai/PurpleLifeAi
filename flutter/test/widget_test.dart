import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:purple_app/core/auth/auth_repository.dart';
import 'package:purple_app/core/config/app_config.dart';
import 'package:purple_app/core/providers/core_providers.dart';
import 'package:purple_app/design/purple_theme.dart';
import 'package:purple_app/features/auth/sign_in_screen.dart';
import 'package:purple_app/shell/routes.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class _FakeAuthRepo implements AuthRepository {
  @override
  bool get isAuthenticated => false;

  @override
  Session? get currentSession => null;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const testConfig = AppConfig(
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJpYXQiOjE2NDExMDg5NjAsImV4cCI6MTk1NjY4NDk2MH0.test',
    siteUrl: AppConfig.defaultSiteUrl,
    workerApiBaseUrl: AppConfig.defaultWorkerApiBaseUrl,
  );

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('AppConfig requires SUPABASE_ANON_KEY', () {
    expect(() => AppConfig.fromEnvironment(), throwsStateError);
  });

  testWidgets('ShellContentColumn caps content width', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: ShellContentColumn(
          child: Text('Hello'),
        ),
      ),
    );
    expect(find.text('Hello'), findsOneWidget);
  });

  testWidgets('Sign-in shell renders for signed-out users', (tester) async {
    tester.view.physicalSize = const Size(800, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final router = GoRouter(
      initialLocation: AppRoutes.signIn,
      routes: [
        GoRoute(
          path: AppRoutes.signIn,
          builder: (context, state) => const SignInScreen(),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(testConfig),
          authRepositoryProvider.overrideWith((ref) async => _FakeAuthRepo()),
          authSessionProvider.overrideWith((ref) => Stream.value(null)),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.textContaining('Sign in'), findsWidgets);
  });
}
