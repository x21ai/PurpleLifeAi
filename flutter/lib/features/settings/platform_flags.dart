import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Platform dark-launch flags from `app_settings` (web `platform-flags.tsx`).
class PlatformFlags {
  const PlatformFlags({
    this.community = false,
    this.dna = false,
    this.friends = false,
  });

  final bool community;
  final bool dna;
  final bool friends;
}

final platformFlagsProvider = FutureProvider<PlatformFlags>((ref) async {
  try {
    final row = await Supabase.instance.client
        .from('app_settings')
        .select(
            'feature_community_enabled, feature_dna_enabled, feature_friends_enabled')
        .eq('id', true)
        .maybeSingle();
    return PlatformFlags(
      community: row?['feature_community_enabled'] == true,
      dna: row?['feature_dna_enabled'] == true,
      friends: row?['feature_friends_enabled'] == true,
    );
  } catch (_) {
    return const PlatformFlags();
  }
});
