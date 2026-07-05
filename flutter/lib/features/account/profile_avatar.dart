import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers/core_providers.dart';
import '../../design/purple_theme.dart';

/// Profile identity for the top bar, menu drawer, and Account sheet.
/// Mirrors web `getAvatarSignedUrl` (`src/lib/avatar.functions.ts`):
/// `profiles.avatar_path` resolves to a signed `journal-media` URL, and the
/// fallback is an initials circle from first/last name or email.
class AvatarProfile {
  const AvatarProfile({
    this.url,
    this.firstName,
    this.lastName,
    this.email,
  });

  final String? url;
  final String? firstName;
  final String? lastName;
  final String? email;

  static const empty = AvatarProfile();

  /// Same rules as web `initialsFrom`: first+last initials, else the first
  /// letter of the email, else "?".
  String get initials {
    final f = (firstName ?? '').trim();
    final l = (lastName ?? '').trim();
    if (f.isNotEmpty || l.isNotEmpty) {
      final combined =
          '${f.isNotEmpty ? f[0] : ''}${l.isNotEmpty ? l[0] : ''}';
      return combined.isNotEmpty ? combined.toUpperCase() : '?';
    }
    final e = (email ?? '').trim();
    return e.isNotEmpty ? e[0].toUpperCase() : '?';
  }

  String get displayName {
    final name = [firstName, lastName]
        .whereType<String>()
        .map((part) => part.trim())
        .where((part) => part.isNotEmpty)
        .join(' ');
    if (name.isNotEmpty) return name;
    if (email?.isNotEmpty == true) return email!;
    return 'Account';
  }
}

/// Loads the signed avatar URL and profile name. Fails open to initials so
/// the shell renders offline or when the profile row is unreadable.
final avatarProfileProvider = FutureProvider<AvatarProfile>((ref) async {
  await ref.watch(authRepositoryProvider.future);
  final client = Supabase.instance.client;
  final session = client.auth.currentSession;
  final userId = session?.user.id;
  final email = session?.user.email;
  if (userId == null) return AvatarProfile(email: email);

  String? firstName;
  String? lastName;
  String? url;
  try {
    final row = await client
        .from('profiles')
        .select('avatar_path, first_name, last_name')
        .eq('id', userId)
        .maybeSingle();
    firstName = row?['first_name'] as String?;
    lastName = row?['last_name'] as String?;
    final path = row?['avatar_path'] as String?;
    if (path != null && path.isNotEmpty) {
      try {
        url = await client.storage
            .from('journal-media')
            .createSignedUrl(path, 60 * 60 * 24);
      } catch (_) {
        url = null;
      }
    }
  } catch (_) {
    // Offline or profile unreadable: initials from the session email.
  }
  return AvatarProfile(
    url: url,
    firstName: firstName,
    lastName: lastName,
    email: email,
  );
});

/// Round avatar: photo when a signed URL exists, else an initials circle on
/// the purple primary token (web `ProfileMenu` / `AvatarCard` fallback).
class ProfileAvatarCircle extends StatelessWidget {
  const ProfileAvatarCircle({
    super.key,
    required this.profile,
    this.size = 32,
  });

  final AvatarProfile profile;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initialsCircle = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: PurpleColors.purplePrimary,
      ),
      child: Text(
        profile.initials,
        style: TextStyle(
          fontSize: size * 0.4,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
      ),
    );

    final url = profile.url;
    if (url == null || url.isEmpty) return initialsCircle;

    return ClipOval(
      child: SizedBox(
        width: size,
        height: size,
        child: Image.network(
          url,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => initialsCircle,
        ),
      ),
    );
  }
}
