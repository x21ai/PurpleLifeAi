import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../shell/router.dart';
import '../../shell/routes.dart';
import '../constants/app_constants.dart';
import '../providers/core_providers.dart';
import 'auth_repository.dart';

/// Handles native auth deep links (`reset-password`, `auth-callback`).
class AuthDeepLinkService {
  AuthDeepLinkService({
    required SupabaseClient supabase,
    required GoRouter router,
    AppLinks? appLinks,
  })  : _supabase = supabase,
        _router = router,
        _appLinks = appLinks ?? AppLinks();

  final SupabaseClient _supabase;
  final GoRouter _router;
  final AppLinks _appLinks;

  StreamSubscription<Uri>? _linkSub;
  bool _listening = false;

  void ensureListening() {
    if (kIsWeb || _listening) return;
    _listening = true;
    unawaited(_handleInitialLink());
    _linkSub = _appLinks.uriLinkStream.listen(
      (uri) => unawaited(_handleUri(uri)),
      onError: (Object error) {
        debugPrint('[auth_deep_link] stream error: $error');
      },
    );
  }

  void dispose() {
    unawaited(_linkSub?.cancel());
    _linkSub = null;
    _listening = false;
  }

  Future<void> _handleInitialLink() async {
    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) {
        await _handleUri(initial);
      }
    } catch (error) {
      debugPrint('[auth_deep_link] initial link failed: $error');
    }
  }

  Future<void> _handleUri(Uri uri) async {
    if (!_isAuthDeepLink(uri)) return;

    if (uri.host == 'reset-password') {
      await _completeAuthCallback(
        uri,
        onSuccess: () => _router.go(AppRoutes.resetPassword),
        expiredQuery: 'reset=expired',
      );
      return;
    }

    if (uri.host == 'auth-callback') {
      await _completeAuthCallback(
        uri,
        onSuccess: () => _router.go(AppRoutes.today),
      );
    }
  }

  Future<void> _completeAuthCallback(
    Uri uri, {
    required VoidCallback onSuccess,
    String? expiredQuery,
  }) async {
    final parsedError = AuthRepository.parseAuthCallbackError(uri);
    if (parsedError != null) {
      if (parsedError.expired && expiredQuery != null) {
        _router.go('${AppRoutes.signIn}?$expiredQuery');
      } else {
        _router.go(AppRoutes.signIn);
      }
      return;
    }

    if (!AuthRepository.isAuthCallbackUri(uri)) return;

    try {
      await _supabase.auth.getSessionFromUrl(uri);
      final session = _supabase.auth.currentSession;
      if (session == null || session.isExpired) {
        debugPrint('[auth_deep_link] OAuth callback produced no valid session');
        _router.go(
          expiredQuery != null
              ? '${AppRoutes.signIn}?$expiredQuery'
              : '${AppRoutes.signIn}?error=session',
        );
        return;
      }
      onSuccess();
    } catch (error, stack) {
      debugPrint('[auth_deep_link] session from url failed: $error\n$stack');
      _router.go(
        expiredQuery != null
            ? '${AppRoutes.signIn}?$expiredQuery'
            : '${AppRoutes.signIn}?error=session',
      );
    }
  }

  bool _isAuthDeepLink(Uri uri) {
    if (uri.scheme != AppConstants.iosBundleId) return false;
    return uri.host == 'reset-password' || uri.host == 'auth-callback';
  }
}

final authDeepLinkServiceProvider = Provider<AuthDeepLinkService>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  final router = ref.watch(routerProvider);
  final service = AuthDeepLinkService(supabase: supabase, router: router);
  ref.onDispose(service.dispose);
  return service;
});

/// Binds native password-recovery deep links for the app lifetime.
class AuthDeepLinkListener extends ConsumerStatefulWidget {
  const AuthDeepLinkListener({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<AuthDeepLinkListener> createState() =>
      _AuthDeepLinkListenerState();
}

class _AuthDeepLinkListenerState extends ConsumerState<AuthDeepLinkListener> {
  @override
  void initState() {
    super.initState();
    ref.read(authDeepLinkServiceProvider).ensureListening();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
