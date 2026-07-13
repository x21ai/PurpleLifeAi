import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/worker_client.dart';
import '../../core/constants/app_constants.dart';
import '../../core/providers/core_providers.dart';

/// Wearable OAuth providers supported in Tools (mirrors web connection cards).
enum WearableOAuthProvider { oura, whoop }

/// OAuth scopes and redirect URIs aligned with web `oura-connection.tsx` /
/// `whoop-connection.tsx` and native `src/lib/native/wearable-oauth.ts`.
abstract final class WearableOAuth {
  static const ouraScope =
      'email personal daily heartrate workout tag session spo2';

  static const whoopScope =
      'read:recovery read:cycles read:sleep read:workout '
      'read:profile read:body_measurement offline';

  static const nativeRedirectOura =
      '${AppConstants.iosBundleId}://oauth-oura-callback';

  static const nativeRedirectWhoop =
      '${AppConstants.iosBundleId}://oauth-whoop-callback';

  static String redirectUri(WearableOAuthProvider provider) {
    if (kIsWeb) {
      final origin = Uri.base.origin;
      return switch (provider) {
        WearableOAuthProvider.oura => '$origin/oauth/oura/callback',
        WearableOAuthProvider.whoop => '$origin/oauth/whoop/callback',
      };
    }
    return switch (provider) {
      WearableOAuthProvider.oura => nativeRedirectOura,
      WearableOAuthProvider.whoop => nativeRedirectWhoop,
    };
  }

  static WearableOAuthProvider? providerFromCallbackUri(Uri uri) {
    final host = uri.host;
    if (host == 'oauth-oura-callback') {
      return WearableOAuthProvider.oura;
    }
    if (host == 'oauth-whoop-callback') {
      return WearableOAuthProvider.whoop;
    }

    final value = uri.toString();
    if (value.startsWith(nativeRedirectOura)) {
      return WearableOAuthProvider.oura;
    }
    if (value.startsWith(nativeRedirectWhoop)) {
      return WearableOAuthProvider.whoop;
    }
    if (uri.path == '/oauth/oura/callback') {
      return WearableOAuthProvider.oura;
    }
    if (uri.path == '/oauth/whoop/callback') {
      return WearableOAuthProvider.whoop;
    }
    return null;
  }

  /// Pre-connect hint when the native redirect URI is not yet registered.
  ///
  /// Oura Cloud already has `nativeRedirectOura` (see OPEN-ISSUES
  /// `oura-native-redirect-console`). Whoop still needs console registration.
  static String? nativeConnectSetupHint(WearableOAuthProvider provider) {
    if (kIsWeb) return null;
    return switch (provider) {
      WearableOAuthProvider.oura => null,
      WearableOAuthProvider.whoop =>
        'On iPhone, register $nativeRedirectWhoop in the Whoop developer '
            'console before Connect works.',
    };
  }
}

/// User-facing Oura edge-function errors (sync + OAuth exchange).
String ouraFunctionErrorMessage(
  dynamic data, {
  int? statusCode,
}) {
  if (data is Map) {
    final error = data['error'];
    if (error is String && error.isNotEmpty) {
      final lower = error.toLowerCase();
      if (lower.contains('redirect_uri') || lower.contains('redirect uri')) {
        return 'Oura rejected the redirect URI. Register '
            '${WearableOAuth.nativeRedirectOura} in the Oura developer console, '
            'then try again.';
      }
      return error;
    }
  }
  if (statusCode != null) {
    return "Couldn't reach Oura sync service (HTTP $statusCode). Please try again.";
  }
  return 'Oura connection failed. Try again.';
}

/// User-facing Whoop Worker errors (OAuth exchange + sync).
String whoopFunctionErrorMessage(
  dynamic data, {
  int? statusCode,
}) {
  if (data is Map) {
    final error = data['error'];
    if (error is String && error.isNotEmpty) {
      final lower = error.toLowerCase();
      if (lower.contains('redirect_uri') || lower.contains('redirect uri')) {
        return 'Whoop rejected the redirect URI. Register '
            '${WearableOAuth.nativeRedirectWhoop} in the Whoop developer console, '
            'then try again.';
      }
      return error;
    }
  }
  if (statusCode != null) {
    return "Couldn't reach Whoop sync service (HTTP $statusCode). Please try again.";
  }
  return 'Whoop connection failed. Try again.';
}

/// Maps OAuth `error` query params to readable copy (mirrors web callbacks).
String oauthCallbackQueryErrorMessage(String oauthError, String? description) {
  final lower = oauthError.toLowerCase();
  if (lower == 'access_denied') {
    return 'Sign-in was cancelled. Tap Connect to try again.';
  }
  if (description != null && description.isNotEmpty) {
    return '$oauthError: $description';
  }
  return oauthError;
}

/// Broadcast when a wearable OAuth flow completes successfully.
final StreamController<WearableOAuthProvider> wearableOAuthConnectedController =
    StreamController<WearableOAuthProvider>.broadcast();

/// Broadcast OAuth failures so Tools can show inline errors (not SnackBars).
final StreamController<WearableOAuthFailure> wearableOAuthErrorController =
    StreamController<WearableOAuthFailure>.broadcast();

/// A wearable OAuth callback failed.
class WearableOAuthFailure {
  const WearableOAuthFailure({
    required this.provider,
    required this.message,
  });

  final WearableOAuthProvider provider;
  final String message;
}

/// Emits an OAuth failure for Tools inline display (not SnackBars).
void emitWearableOAuthFailure(
  WearableOAuthProvider provider,
  String message,
) {
  if (!wearableOAuthErrorController.isClosed) {
    wearableOAuthErrorController.add(
      WearableOAuthFailure(provider: provider, message: message),
    );
  }
}

/// Opens provider consent in the system browser and completes exchange when
/// the app receives the callback (deep link on native, in-app route on web).
class WearableOAuthService {
  WearableOAuthService({
    required SupabaseClient supabase,
    required WorkerClient worker,
    AppLinks? appLinks,
  })  : _supabase = supabase,
        _worker = worker,
        _appLinks = appLinks ?? AppLinks();

  final SupabaseClient _supabase;
  final WorkerClient _worker;
  final AppLinks _appLinks;

  StreamSubscription<Uri>? _linkSub;
  StreamSubscription<AuthState>? _authSub;
  bool _listening = false;
  Uri? _pendingCallback;
  bool _processingPending = false;

  /// Bind native deep-link listener (no-op on web). Safe to call repeatedly.
  void ensureDeepLinkListener() {
    if (kIsWeb || _listening) return;
    _listening = true;
    unawaited(_handleInitialLink());
    _linkSub = _appLinks.uriLinkStream.listen(
      (uri) => unawaited(_safeCompleteFromCallbackUri(uri)),
      onError: (Object error) {
        debugPrint('[wearable_oauth] deep link error: $error');
      },
    );
    _authSub = _supabase.auth.onAuthStateChange.listen((event) {
      if (event.session != null && _pendingCallback != null) {
        unawaited(_flushPendingCallback());
      }
    });
  }

  void dispose() {
    unawaited(_linkSub?.cancel());
    unawaited(_authSub?.cancel());
    _linkSub = null;
    _authSub = null;
    _listening = false;
    _pendingCallback = null;
  }

  Future<void> _handleInitialLink() async {
    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) {
        await _safeCompleteFromCallbackUri(initial);
      }
    } catch (error) {
      debugPrint('[wearable_oauth] initial link failed: $error');
    }
  }

  Future<void> _safeCompleteFromCallbackUri(Uri uri) async {
    try {
      await completeFromCallbackUri(uri);
    } catch (error, stack) {
      debugPrint('[wearable_oauth] callback failed: $error\n$stack');
      final provider = WearableOAuth.providerFromCallbackUri(uri);
      if (provider != null) {
        _emitFailure(provider, _callbackFailureMessage(provider, error));
      }
    }
  }

  String _callbackFailureMessage(WearableOAuthProvider provider, Object error) {
    if (error is StateError) return error.message;
    if (error is WorkerApiException) {
      final message = error.message;
      return provider == WearableOAuthProvider.oura
          ? ouraFunctionErrorMessage(
              {'error': message},
              statusCode: error.statusCode,
            )
          : whoopFunctionErrorMessage(
              {'error': message},
              statusCode: error.statusCode,
            );
    }
    final label = provider == WearableOAuthProvider.oura ? 'Oura' : 'Whoop';
    return "Something went wrong finishing $label sign-in. Try again.";
  }

  Future<void> _flushPendingCallback() async {
    if (_processingPending) return;
    final pending = _pendingCallback;
    if (pending == null) return;
    _processingPending = true;
    try {
      await _safeCompleteFromCallbackUri(pending);
      _pendingCallback = null;
    } finally {
      _processingPending = false;
    }
  }

  Future<void> connect(WearableOAuthProvider provider) async {
    ensureDeepLinkListener();
    final session = await _waitForSession();
    if (session == null) {
      throw StateError('Please sign in first');
    }

    final redirect = WearableOAuth.redirectUri(provider);
    final authorizeUrl = switch (provider) {
      WearableOAuthProvider.oura => await _buildOuraAuthorizeUrl(
          userId: session.user.id,
          redirectUri: redirect,
        ),
      WearableOAuthProvider.whoop => await _buildWhoopAuthorizeUrl(
          userId: session.user.id,
          redirectUri: redirect,
        ),
    };

    final launched = await launchUrl(
      authorizeUrl,
      mode: LaunchMode.externalApplication,
    );
    if (!launched) {
      throw StateError('Could not open the sign-in page. Try again.');
    }
  }

  Future<Session?> _waitForSession({
    Duration timeout = const Duration(seconds: 8),
  }) async {
    final existing = _supabase.auth.currentSession;
    if (existing != null) return existing;

    final completer = Completer<Session?>();
    late final StreamSubscription<AuthState> sub;
    sub = _supabase.auth.onAuthStateChange.listen((event) {
      if (event.session != null && !completer.isCompleted) {
        completer.complete(event.session);
      }
    });

    final session = await completer.future
        .timeout(timeout, onTimeout: () => _supabase.auth.currentSession)
        .whenComplete(() => sub.cancel());
    return session;
  }

  Future<Uri> _buildOuraAuthorizeUrl({
    required String userId,
    required String redirectUri,
  }) async {
    final response = await _supabase.functions.invoke(
      'oura-sync',
      body: const {'action': 'config'},
    );
    if (response.status != 200) {
      throw StateError("Couldn't reach Oura sync service. Please try again.");
    }
    final data = response.data;
    final clientId = data is Map ? data['client_id'] as String? : null;
    if (clientId == null || clientId.isEmpty) {
      throw StateError(
        "Oura isn't configured yet. Add OURA_CLIENT_ID and "
        'OURA_CLIENT_SECRET in backend settings.',
      );
    }

    return Uri.https('cloud.ouraring.com', '/oauth/authorize', {
      'response_type': 'code',
      'client_id': clientId,
      'redirect_uri': redirectUri,
      'scope': WearableOAuth.ouraScope,
      'state': userId,
    });
  }

  Future<Uri> _buildWhoopAuthorizeUrl({
    required String userId,
    required String redirectUri,
  }) async {
    final cfg = await _worker.getWhoopConfig();
    final clientId = cfg['client_id'] as String?;
    if (clientId == null || clientId.isEmpty) {
      throw StateError(
        "Whoop isn't configured yet. Add WHOOP_CLIENT_ID and "
        'WHOOP_CLIENT_SECRET in backend settings.',
      );
    }

    return Uri.https('api.prod.whoop.com', '/oauth/oauth2/auth', {
      'response_type': 'code',
      'client_id': clientId,
      'redirect_uri': redirectUri,
      'scope': WearableOAuth.whoopScope,
      'state': userId,
    });
  }

  /// Exchange authorization code from callback URI (web route or native link).
  Future<void> completeFromCallbackUri(Uri uri) async {
    final provider = WearableOAuth.providerFromCallbackUri(uri);
    if (provider == null) return;

    final oauthError = uri.queryParameters['error'];
    if (oauthError != null && oauthError.isNotEmpty) {
      final description = uri.queryParameters['error_description'];
      throw StateError(
        oauthCallbackQueryErrorMessage(oauthError, description),
      );
    }

    final code = uri.queryParameters['code'];
    if (code == null || code.isEmpty) {
      throw StateError('Missing authorization code');
    }

    final session = await _waitForSession();
    if (session == null) {
      _pendingCallback = uri;
      debugPrint('[wearable_oauth] session not ready; queued callback');
      return;
    }
    _pendingCallback = null;

    final state = uri.queryParameters['state'];
    if (state != null && state.isNotEmpty && state != session.user.id) {
      throw StateError('OAuth state mismatch');
    }

    final redirectUri = WearableOAuth.redirectUri(provider);
    if (provider == WearableOAuthProvider.oura) {
      final response = await _supabase.functions.invoke(
        'oura-sync',
        body: {
          'action': 'exchange',
          'code': code,
          'redirect_uri': redirectUri,
        },
      );
      if (response.status != 200) {
        throw StateError(
          ouraFunctionErrorMessage(
            response.data,
            statusCode: response.status,
          ),
        );
      }
      final data = response.data;
      if (data is Map && data['error'] != null) {
        throw StateError(ouraFunctionErrorMessage(data));
      }
    } else {
      try {
        await _worker.postWhoopExchange(code: code, redirectUri: redirectUri);
      } on WorkerApiException catch (error) {
        throw StateError(
          whoopFunctionErrorMessage(
            {'error': error.message},
            statusCode: error.statusCode,
          ),
        );
      }
    }

    wearableOAuthConnectedController.add(provider);
  }

  void _emitFailure(WearableOAuthProvider provider, String message) {
    emitWearableOAuthFailure(provider, message);
  }
}

/// Keeps native deep-link OAuth bound for the app lifetime (cold-start safe).
class WearableOAuthListener extends ConsumerWidget {
  const WearableOAuthListener({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(wearableOAuthServiceProvider);
    return child;
  }
}
