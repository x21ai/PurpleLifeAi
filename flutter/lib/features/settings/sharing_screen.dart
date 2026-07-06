import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/providers/core_providers.dart';
import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../care/care_relationship_tile.dart';
import '../care/care_repository.dart';
import '../health/apple_health_panel.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';

/// Archived caregiver relationships (owner side), read directly from
/// `care_relationships` where `archived_at IS NOT NULL`.
///
/// Mirrors the web `fetchMyCaregivers({ archived: true })` list. This is a
/// direct SELECT under the owner RLS policy (`auth.uid() = owner_id`), so no
/// Worker route is required — unlike archive/unarchive/delete *mutations*,
/// which the web routes through `care.functions.ts` and are left stubbed.
final archivedCaregiversProvider =
    FutureProvider.autoDispose<List<ArchivedCaregiver>>((ref) async {
  ref.watch(authSessionProvider);
  final supabase = ref.watch(supabaseClientProvider);
  final connectivity = ref.watch(connectivityServiceProvider);
  final userId = supabase.auth.currentSession?.user.id;
  if (userId == null || !connectivity.isOnline) return const [];

  try {
    final rows = await supabase
        .from('care_relationships')
        .select(
          'id, invite_email, role, relationship_label, archived_at',
        )
        .eq('owner_id', userId)
        .not('archived_at', 'is', null)
        .order('archived_at', ascending: false);
    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(ArchivedCaregiver.fromMap)
        .toList();
  } catch (_) {
    return const [];
  }
});

/// A single archived caregiver relationship row.
class ArchivedCaregiver {
  const ArchivedCaregiver({
    required this.id,
    required this.inviteEmail,
    required this.role,
    this.relationshipLabel,
    this.archivedAt,
  });

  final String id;
  final String inviteEmail;
  final String role;
  final String? relationshipLabel;
  final String? archivedAt;

  String get subtitle {
    final label = relationshipLabel?.trim();
    if (label != null && label.isNotEmpty) return label;
    return role;
  }

  factory ArchivedCaregiver.fromMap(Map<String, dynamic> map) {
    return ArchivedCaregiver(
      id: map['id'] as String,
      inviteEmail: (map['invite_email'] as String?) ?? '',
      role: (map['role'] as String?) ?? 'caregiver',
      relationshipLabel: map['relationship_label'] as String?,
      archivedAt: map['archived_at'] as String?,
    );
  }
}

/// Sharing and access: caregivers you invited and people sharing with you.
class SharingScreen extends ConsumerWidget {
  const SharingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharingAsync = ref.watch(sharingListProvider);
    final pendingCount = ref.watch(carePendingCountProvider).valueOrNull ?? 0;
    final archived = ref.watch(archivedCaregiversProvider).valueOrNull ?? const [];

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(sharingListProvider);
          ref.invalidate(carePendingCountProvider);
          ref.invalidate(archivedCaregiversProvider);
          await ref.read(sharingListProvider.future);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          // Bottom padding is a small buffer only: NativeAppShell already
          // reserves shellTabBarInset() worth of space for the floating nav
          // bar, so stacking another ~120px here doubled up as excess
          // whitespace (tf-bottom-whitespace).
          padding: const EdgeInsets.only(top: 24, bottom: 32),
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
                  // 40px matches web `settings.sharing.tsx` h1
                  // (text-[40px]); fixes tf-heading-typography (this was
                  // silently falling back to Material's 36px default since
                  // displaySmall has no size override in PurpleTheme).
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontFamily: PurpleType.serif,
                        fontSize: 40,
                        height: 1.05,
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
                const SizedBox(height: 20),
                // Pending approvals strip → caregiver inbox (web sharing page).
                _PendingApprovalsCard(count: pendingCount),
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
                  data: (data) => _SharingBody(data: data, archived: archived),
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

/// Pending caregiver-changes strip that routes to the caregiver inbox.
class _PendingApprovalsCard extends StatelessWidget {
  const _PendingApprovalsCard({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    final headline = count == 0
        ? 'Nothing waiting for your review'
        : '$count ${count == 1 ? 'change is' : 'changes are'} waiting for you';
    return GlassCard(
      onTap: () => context.go(AppRoutes.careInbox),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      child: Row(
        children: [
          if (count > 0) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                '$count',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  headline,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontFamily: GoogleFonts.sourceSerif4().fontFamily,
                        color: Colors.white.withValues(alpha: 0.92),
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Open the caregiver inbox to review',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right,
            size: 18,
            color: Colors.white.withValues(alpha: 0.4),
          ),
        ],
      ),
    );
  }
}

class _SharingBody extends StatefulWidget {
  const _SharingBody({required this.data, required this.archived});

  final SharingListData data;
  final List<ArchivedCaregiver> archived;

  @override
  State<_SharingBody> createState() => _SharingBodyState();
}

class _SharingBodyState extends State<_SharingBody> {
  bool _showArchived = false;

  @override
  Widget build(BuildContext context) {
    final data = widget.data;
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
        if (widget.archived.isNotEmpty) ...[
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => setState(() => _showArchived = !_showArchived),
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              minimumSize: const Size(44, 44),
              alignment: Alignment.centerLeft,
              foregroundColor: Colors.white.withValues(alpha: 0.6),
            ),
            child: Text(
              '${_showArchived ? 'Hide' : 'Show'} archived (${widget.archived.length})',
            ),
          ),
          if (_showArchived)
            for (final row in widget.archived)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Opacity(
                  opacity: 0.85,
                  child: CareRelationshipTile(
                    title: row.inviteEmail,
                    subtitle: row.subtitle,
                    status: 'archived',
                  ),
                ),
              ),
        ],
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
        // Inviting a caregiver, editing scopes, and archive/unarchive/delete
        // are write mutations the web routes through the Worker
        // (care.functions.ts). No matching /api routes exist yet, so those
        // stay web-only here. Reads above (lists, pending count, archived) are
        // direct Supabase SELECTs under owner RLS and work in-app.
        Text(
          'Inviting caregivers and editing their access is available on the '
          'web app for now (blocked on Worker routes, care.functions.ts).',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.45),
                height: 1.4,
              ),
        ),
      ],
    );
  }
}
