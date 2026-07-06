import 'package:flutter/foundation.dart';

import '../constants/app_constants.dart';

/// Supabase Auth redirect targets for email and OAuth flows.
abstract final class AuthRedirectUris {
  /// Native Google/Apple OAuth callback (Capacitor parity).
  static const nativeOAuthCallback =
      '${AppConstants.iosBundleId}://auth-callback';

  /// OAuth redirect after Apple / Google sign-in.
  ///
  /// Web uses the current origin root (mirrors `src/lib/auth-oauth.ts`).
  /// Native uses the custom scheme deep link handled by [AuthDeepLinkService].
  static String oauthCallback(String siteUrl) {
    if (kIsWeb) {
      final origin = Uri.base.origin;
      if (origin.isNotEmpty && origin != 'null') {
        return '$origin/';
      }
      final base =
          siteUrl.endsWith('/') ? siteUrl.substring(0, siteUrl.length - 1) : siteUrl;
      return '$base/';
    }
    return nativeOAuthCallback;
  }

  /// Web and Flutter web preview use the TanStack reset page.
  static String passwordReset(String siteUrl) {
    if (kIsWeb) {
      return '$siteUrl/reset-password';
    }
    return '${AppConstants.iosBundleId}://reset-password';
  }
}
