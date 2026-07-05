import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shell/routes.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'care_relationship_tile.dart';
import 'care_repository.dart';

/// Care hub: people you care for and quick link to sharing settings.
class CareIndexScreen extends ConsumerWidget {
  const CareIndexScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final indexAsync = ref.watch(careIndexProvider);

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(careIndexProvider);
          await ref.read(careIndexProvider.future);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: indexAsync.when(
              loading: () => const LoadingSkeleton(
                sectionTitle: 'Care',
                tileCount: 3,
              ),
              error: (_, __) => const EmptyState(
                eyebrow: 'Care',
                title: 'Could not load care',
                body: 'Pull to refresh and try again in a moment.',
              ),
              data: (data) => _CareIndexBody(data: data),
            ),
          ),
        ),
      ),
    );
  }
}

class _CareIndexBody extends StatelessWidget {
  const _CareIndexBody({required this.data});

  final CareIndexData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'CARE',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 1.2,
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Care',
          style: Theme.of(context).textTheme.displaySmall?.copyWith(
                fontFamily: GoogleFonts.sourceSerif4().fontFamily,
                height: 1.04,
                color: Colors.white.withValues(alpha: 0.95),
              ),
        ),
        const SizedBox(height: 12),
        Text(
          'Manage who you care for and who cares for you.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.65),
                height: 1.5,
              ),
        ),
        if (data.loadError != null) ...[
          const SizedBox(height: 16),
          Text(
            data.loadError!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
        ],
        const SizedBox(height: 28),
        const _SectionHeader(
          title: 'People you care for',
          subtitle: 'They control what you can see and can revoke access any time.',
        ),
        const SizedBox(height: 12),
        if (data.pendingInvites.isNotEmpty) ...[
          Text(
            'PENDING INVITES',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
          ),
          const SizedBox(height: 8),
          for (final invite in data.pendingInvites)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: CareRelationshipTile(
                title: 'Invite pending',
                subtitle: invite.inviteEmail,
                status: invite.status,
                trailing: Icons.mail_outline,
              ),
            ),
          const SizedBox(height: 12),
        ],
        if (data.owners.isEmpty && data.pendingInvites.isEmpty)
          EmptyState(
            eyebrow: 'Care',
            title: 'No one is sharing with you yet',
            body:
                'When someone invites you as a caregiver, they appear here. Ask them to add you from Sharing settings.',
            primaryActionLabel: 'Open sharing settings',
            onPrimaryAction: () => context.go(AppRoutes.settingsSharing),
          )
        else
          for (final owner in data.owners)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: CareRelationshipTile(
                title: owner.primaryLabel,
                subtitle: owner.subtitle,
                status: owner.status,
                onTap: () => context.go(AppRoutes.careDashboard(owner.ownerId)),
              ),
            ),
        const SizedBox(height: 32),
        const _SectionHeader(
          title: 'My caregivers',
          subtitle: 'People you have invited to help with your care.',
        ),
        const SizedBox(height: 12),
        if (data.myCaregivers.isEmpty)
          EmptyState(
            eyebrow: 'Sharing',
            title: 'No caregivers yet',
            body: 'Invite someone from Sharing settings when you are ready.',
            primaryActionLabel: 'Invite caregiver',
            onPrimaryAction: () => context.go(AppRoutes.settingsSharing),
          )
        else ...[
          for (final caregiver in data.myCaregivers)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: CareRelationshipTile(
                title: caregiver.inviteEmail,
                subtitle: caregiver.subtitle,
                status: caregiver.status,
                onTap: () => context.go(AppRoutes.settingsSharing),
              ),
            ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => context.go(AppRoutes.settingsSharing),
            child: const Text('Manage sharing'),
          ),
        ],
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontFamily: GoogleFonts.sourceSerif4().fontFamily,
                color: Colors.white.withValues(alpha: 0.95),
              ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.55),
              ),
        ),
      ],
    );
  }
}
