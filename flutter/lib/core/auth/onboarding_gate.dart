import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Pref key prefix for per-user onboarding completion (mirrors web
/// `purple-onboarded` localStorage in `src/routes/_app.tsx`).
const onboardedPrefPrefix = 'purple.onboarded.';

/// In-memory positive cache so GoRouter redirects after password login do not
/// re-await SharedPreferences + network on every refresh tick.
final Map<String, bool> _onboardedMemoryCache = {};

@visibleForTesting
void clearOnboardingGateMemoryCache() => _onboardedMemoryCache.clear();

/// True when the profiles row shows first-run onboarding is done.
///
/// Matches web `_app.tsx`: `onboarded_at` OR non-empty `first_name`.
bool profileIsOnboarded(Map<String, dynamic>? profile) {
  if (profile == null) return false;
  if (profile['onboarded_at'] != null) return true;
  final firstName = profile['first_name'];
  if (firstName is String && firstName.trim().isNotEmpty) return true;
  return false;
}

String onboardedPrefKey(String userId) => '$onboardedPrefPrefix$userId';

Future<bool> readOnboardedCache(String userId) async {
  if (_onboardedMemoryCache[userId] == true) return true;
  try {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getBool(onboardedPrefKey(userId)) == true;
    if (cached) _onboardedMemoryCache[userId] = true;
    return cached;
  } catch (error, stack) {
    debugPrint('[onboarding_gate] cache read failed: $error\n$stack');
    return false;
  }
}

Future<void> markOnboardedCache(String userId) async {
  _onboardedMemoryCache[userId] = true;
  try {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(onboardedPrefKey(userId), true);
  } catch (error, stack) {
    debugPrint('[onboarding_gate] cache write failed: $error\n$stack');
  }
}

Future<void> clearOnboardedCache(String userId) async {
  _onboardedMemoryCache.remove(userId);
  try {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(onboardedPrefKey(userId));
  } catch (error, stack) {
    debugPrint('[onboarding_gate] cache clear failed: $error\n$stack');
  }
}

/// Resolves whether [userId] has completed onboarding.
///
/// Fail-open on timeout/error/ambiguous null profile so flaky mobile networks
/// cannot trap signed-in live users in a `/welcome` ↔ `/today` redirect loop.
/// Welcome is only forced when a successful profile read proves the row lacks
/// `onboarded_at` and a non-empty `first_name`.
Future<bool> resolveOnboarded({
  required SupabaseClient client,
  required String userId,
  Duration timeout = const Duration(seconds: 10),
}) async {
  if (await readOnboardedCache(userId)) return true;

  try {
    var profile = await _fetchProfile(client, userId, timeout);
    // Null row is ambiguous (missing profile vs RLS/session race right after
    // password grant). Retry once, then fail open rather than force welcome.
    if (profile == null) {
      await Future<void>.delayed(const Duration(milliseconds: 350));
      profile = await _fetchProfile(client, userId, timeout);
    }
    if (profile == null) {
      debugPrint(
        '[onboarding_gate] profile missing after retry for $userId; fail-open',
      );
      return true;
    }

    final onboarded = profileIsOnboarded(profile);
    if (onboarded) {
      await markOnboardedCache(userId);
    }
    return onboarded;
  } on TimeoutException catch (error) {
    debugPrint('[onboarding_gate] profile lookup timed out: $error');
    return true;
  } catch (error, stack) {
    debugPrint('[onboarding_gate] profile lookup failed: $error\n$stack');
    return true;
  }
}

Future<Map<String, dynamic>?> _fetchProfile(
  SupabaseClient client,
  String userId,
  Duration timeout,
) {
  return client
      .from('profiles')
      .select('id, onboarded_at, first_name')
      .eq('id', userId)
      .maybeSingle()
      .timeout(timeout);
}
