import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/worker_client.dart';
import '../../core/constants/app_constants.dart';

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
}

/// Broadcast when a wearable OAuth flow completes successfully.
final StreamController<WearableOAuthProvider> wearableOAuthConnectedController =
    StreamController<WearableOAuthProvider>.broadcast();

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
  bool _listening = false;

  /// Bind native deep-link listener (no-op on web).
  void ensureDeepLinkListener() {
    if (kIsWeb || _listening) return;
    _listening = true;
    unawaited(_handleInitialLink());
    _linkSub = _appLinks.uriLinkStream.listen(
      (uri) => unawaited(completeFromCallbackUri(uri)),
      onError: (Object error) {
        debugPrint('[wearable_oauth] deep link error: $error');
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
        await completeFromCallbackUri(initial);
      }
    } catch (error) {
      debugPrint('[wearable_oauth] initial link failed: $error');
    }
  }

  Future<void> connect(WearableOAuthProvider provider) async {
    ensureDeepLinkListener();
    final session = _supabase.auth.currentSession;
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
        description == null || description.isEmpty
            ? oauthError
            : '$oauthError: $description',
      );
    }

    final code = uri.queryParameters['code'];
    if (code == null || code.isEmpty) {
      throw StateError('Missing authorization code');
    }

    final session = _supabase.auth.currentSession;
    if (session == null) {
      throw StateError('Not signed in');
    }

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
      if (response.status != 200 || response.data == null) {
        throw StateError('Oura connection failed. Try again.');
      }
    } else {
      await _worker.postWhoopExchange(code: code, redirectUri: redirectUri);
    }

    wearableOAuthConnectedController.add(provider);
  }
}
