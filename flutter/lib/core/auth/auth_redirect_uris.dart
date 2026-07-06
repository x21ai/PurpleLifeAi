import 'package:flutter/foundation.dart';

import '../constants/app_constants.dart';

/// Supabase Auth redirect targets for email flows (password reset, etc.).
abstract final class AuthRedirectUris {
  /// Web and Flutter web preview use the TanStack reset page.
  static String passwordReset(String siteUrl) {
    if (kIsWeb) {
      return '$siteUrl/reset-password';
    }
    return '${AppConstants.iosBundleId}://reset-password';
  }
}
