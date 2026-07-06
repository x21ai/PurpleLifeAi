import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/auth/auth_repository.dart';
import 'package:purple_app/core/auth/auth_state.dart' as core_auth;
import 'package:purple_app/core/providers/core_providers.dart';
import 'package:purple_app/shell/auth_gate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  group('authGateStatusProvider', () {
    test('reports loading while auth repository initializes', () {
      final completer = Completer<AuthRepository>();
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => completer.future),
        ],
      );
      addTearDown(container.dispose);

      expect(
        container.read(core_auth.authGateStatusProvider),
        core_auth.AuthGateStatus.loading,
      );
    });

    test('reports signedOut when session stream emits null', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) async => _FakeAuthRepo()),
          authSessionProvider.overrideWith((ref) => Stream.value(null)),
        ],
      );
      addTearDown(container.dispose);

      await container.read(authRepositoryProvider.future);
      await _waitFor(
        () =>
            container.read(core_auth.authGateStatusProvider) ==
            core_auth.AuthGateStatus.signedOut,
      );
    });

    test('reports signedIn when session stream emits session', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) async => _FakeAuthRepo()),
          authSessionProvider.overrideWith((ref) => Stream.value(_fakeSession())),
        ],
      );
      addTearDown(container.dispose);

      await container.read(authRepositoryProvider.future);
      await _waitFor(
        () =>
            container.read(core_auth.authGateStatusProvider) ==
            core_auth.AuthGateStatus.signedIn,
      );
    });
  });

  group('AuthGate widget', () {
    testWidgets('shows spinner while auth is loading', (tester) async {
      final completer = Completer<AuthRepository>();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWith((ref) => completer.future),
          ],
          child: const MaterialApp(
            home: AuthGate(child: Text('protected')),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('protected'), findsNothing);
    });

    testWidgets('renders child when signed in', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWith((ref) async => _FakeAuthRepo()),
            authSessionProvider.overrideWith((ref) => Stream.value(_fakeSession())),
          ],
          child: const MaterialApp(
            home: AuthGate(child: Text('protected')),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('protected'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('hides child when signed out', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWith((ref) async => _FakeAuthRepo()),
            authSessionProvider.overrideWith((ref) => Stream.value(null)),
          ],
          child: const MaterialApp(
            home: AuthGate(child: Text('protected')),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('protected'), findsNothing);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });
  });
}

Future<void> _waitFor(
  bool Function() condition, {
  Duration timeout = const Duration(seconds: 2),
}) async {
  final deadline = DateTime.now().add(timeout);
  while (!condition()) {
    if (DateTime.now().isAfter(deadline)) {
      fail('Timed out waiting for condition');
    }
    await Future<void>.delayed(Duration.zero);
  }
}

Session _fakeSession() {
  return Session(
    accessToken: 'test-token',
    tokenType: 'bearer',
    user: const User(
      id: 'bb160030-2ed6-45d7-8a5a-7f6f7879e9bb',
      appMetadata: {},
      userMetadata: {},
      aud: 'authenticated',
      createdAt: '2026-01-01T00:00:00Z',
      email: 'test@purplelife.org',
    ),
  );
}

class _FakeAuthRepo implements AuthRepository {
  @override
  bool get isAuthenticated => false;

  @override
  Session? get currentSession => null;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
