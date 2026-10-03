import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/ploy_colors.dart';
import '../../design/purple_theme.dart';
import '../../shell/routes.dart';

class _BrowseLink {
  const _BrowseLink({
    required this.label,
    required this.detail,
    required this.path,
    required this.icon,
  });

  final String label;
  final String detail;
  final String path;
  final IconData icon;
}

const _links = [
  _BrowseLink(
    label: 'Journal',
    detail: 'Notes, audio, and video',
    path: AppRoutes.journal,
    icon: Icons.menu_book_outlined,
  ),
  _BrowseLink(
    label: 'Medications',
    detail: 'Doses, refills, and history',
    path: AppRoutes.meds,
    icon: Icons.medication_outlined,
  ),
  _BrowseLink(
    label: 'Vitals',
    detail: 'Scores and connected readings',
    path: AppRoutes.vitals,
    icon: Icons.monitor_heart_outlined,
  ),
  _BrowseLink(
    label: 'Data',
    detail: 'Sources behind Today',
    path: AppRoutes.data,
    icon: Icons.insights_outlined,
  ),
  _BrowseLink(
    label: 'Plan',
    detail: 'Protocol and recommendations',
    path: AppRoutes.plan,
    icon: Icons.auto_stories_outlined,
  ),
  _BrowseLink(
    label: 'Ask Maya',
    detail: 'Questions about your records',
    path: AppRoutes.askMaya,
    icon: Icons.chat_bubble_outline,
  ),
  _BrowseLink(
    label: 'Reports',
    detail: 'Labs and uploaded documents',
    path: AppRoutes.reports,
    icon: Icons.description_outlined,
  ),
  _BrowseLink(
    label: 'Care',
    detail: 'Caregivers and shared chat',
    path: AppRoutes.careIndex,
    icon: Icons.favorite_outline,
  ),
  _BrowseLink(
    label: 'Tools',
    detail: 'Wearables and connections',
    path: AppRoutes.tools,
    icon: Icons.watch_outlined,
  ),
  _BrowseLink(
    label: 'Timeline',
    detail: 'What happened, in order',
    path: AppRoutes.timeline,
    icon: Icons.timeline,
  ),
  _BrowseLink(
    label: 'Hydration',
    detail: 'Log what you drank',
    path: AppRoutes.hydration,
    icon: Icons.water_drop_outlined,
  ),
  _BrowseLink(
    label: 'Log a seizure',
    detail: 'Record an event',
    path: AppRoutes.seizuresNew,
    icon: Icons.bolt_outlined,
  ),
  _BrowseLink(
    label: 'Account',
    detail: 'Profile and session',
    path: AppRoutes.account,
    icon: Icons.person_outline,
  ),
  _BrowseLink(
    label: 'Settings',
    detail: 'Appearance, privacy, and more',
    path: AppRoutes.settings,
    icon: Icons.settings_outlined,
  ),
];

/// Grid of every signed-in workflow. Matches the Ploy Browse destination.
class BrowseScreen extends StatelessWidget {
  const BrowseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: purpleMaxContentWidth),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            children: [
              Text(
                'Browse',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.6,
                  color: PloyColors.ink,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Every PurpleLife workflow, in one place.',
                style: TextStyle(fontSize: 15, color: PloyColors.muted),
              ),
              const SizedBox(height: 16),
              for (final link in _links) ...[
                _BrowseRow(link: link),
                const SizedBox(height: 8),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _BrowseRow extends StatelessWidget {
  const _BrowseRow({required this.link});

  final _BrowseLink link;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: PloyColors.surface,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => context.go(link.path),
        child: Container(
          constraints: const BoxConstraints(minHeight: 64),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: PloyColors.line),
          ),
          child: Row(
            children: [
              Icon(link.icon, color: PloyColors.accent),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      link.label,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: PloyColors.ink,
                      ),
                    ),
                    Text(
                      link.detail,
                      style: TextStyle(fontSize: 13, color: PloyColors.muted),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: PloyColors.muted),
            ],
          ),
        ),
      ),
    );
  }
}
