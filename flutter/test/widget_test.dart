import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/app.dart';
import 'package:purple_app/core/auth/auth_repository.dart';
import 'package:purple_app/core/config/app_config.dart';
import 'package:purple_app/core/network/connectivity_service.dart';
import 'package:purple_app/core/providers/core_providers.dart';
import 'package:purple_app/design/purple_theme.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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

  testWidgets('PurpleApp renders sign-in shell', (tester) async {
    tester.view.physicalSize = const Size(800, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

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
    final authRepo = AuthRepository(config: testConfig);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(testConfig),
          authRepositoryProvider.overrideWith((ref) async => authRepo),
          connectivityServiceProvider.overrideWith((ref) {
            final service = ConnectivityService(config: testConfig);
            ref.onDispose(service.dispose);
            return service;
          }),
        ],
        child: const PurpleApp(),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.text('Purple'), findsOneWidget);
    expect(find.text('Sign in'), findsWidgets);
  });
}
