import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shell/routes.dart';
import '../care/care_relationship_tile.dart';
import '../care/care_repository.dart';
import '../health/apple_health_panel.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';

/// Sharing and access: caregivers you invited and people sharing with you.
class SharingScreen extends ConsumerWidget {
  const SharingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharingAsync = ref.watch(sharingListProvider);

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(sharingListProvider);
          await ref.read(sharingListProvider.future);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextButton.icon(
                  onPressed: () => context.go(AppRoutes.settings),
                  icon: Icon(
                    Icons.arrow_back,
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                  label: Text(
                    'Settings',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'SHARING',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.2,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sharing\nand access',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontFamily: GoogleFonts.sourceSerif4().fontFamily,
                        height: 1.02,
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Invite caregivers and manage what they can see.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.65),
                        height: 1.5,
                      ),
                ),
                const SizedBox(height: 28),
                sharingAsync.when(
                  loading: () => const LoadingSkeleton(
                    sectionTitle: 'Sharing',
                    tileCount: 3,
                  ),
                  error: (_, __) => const EmptyState(
                    eyebrow: 'Sharing',
                    title: 'Could not load sharing',
                    body: 'Pull to refresh and try again in a moment.',
                  ),
                  data: (data) => _SharingBody(data: data),
                ),
                const SizedBox(height: 32),
                Text(
                  'APPLE HEALTH',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.2,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(height: 12),
                const AppleHealthPanel(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SharingBody extends StatelessWidget {
  const _SharingBody({required this.data});

  final SharingListData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (data.loadError != null) ...[
          Text(
            data.loadError!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
          const SizedBox(height: 16),
        ],
        Text(
          'My caregivers',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontFamily: GoogleFonts.sourceSerif4().fontFamily,
                color: Colors.white.withValues(alpha: 0.95),
              ),
        ),
        const SizedBox(height: 4),
        Text(
          'People you invited to help with your care.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.55),
              ),
        ),
        const SizedBox(height: 12),
        if (data.myCaregivers.isEmpty)
          const EmptyState(
            eyebrow: 'Sharing',
            title: 'No caregivers yet',
            body:
                'When you invite someone, they appear here with their role and access level.',
          )
        else
          for (final row in data.myCaregivers)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: CareRelationshipTile(
                title: row.inviteEmail,
                subtitle: row.subtitle,
                status: row.status,
              ),
            ),
        const SizedBox(height: 28),
        Text(
          'People sharing with me',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontFamily: GoogleFonts.sourceSerif4().fontFamily,
                color: Colors.white.withValues(alpha: 0.95),
              ),
        ),
        const SizedBox(height: 4),
        Text(
          'Accounts where you are a caregiver.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.55),
              ),
        ),
        const SizedBox(height: 12),
        if (data.sharingWithMe.isEmpty)
          EmptyState(
            eyebrow: 'Care',
            title: 'No shared accounts yet',
            body:
                'When someone adds you as a caregiver, open their dashboard from Care.',
            primaryActionLabel: 'Open Care',
            onPrimaryAction: () => context.go('/care'),
          )
        else
          for (final row in data.sharingWithMe)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: CareRelationshipTile(
                title: row.inviteEmail,
                subtitle: row.subtitle,
                status: row.status,
                onTap: row.status == 'active'
                    ? () => context.go(AppRoutes.careDashboard(row.ownerId))
                    : null,
              ),
            ),
        const SizedBox(height: 16),
        Text(
          'Inviting and editing caregivers is available on the web app for now.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.45),
                height: 1.4,
              ),
        ),
      ],
    );
  }
}
