import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../design/glass_surface.dart';
import '../design/ploy_colors.dart';
import '../design/purple_theme.dart';
import '../design/tokens.dart';
import 'routes.dart';

class _NavTab {
  const _NavTab({
    required this.icon,
    required this.label,
    this.path,
  });

  final String? path;
  final IconData icon;
  final String label;
}

/// Ploy pilot tab bar: Today, Journal, Browse, and a More sheet.
class BottomNav extends StatelessWidget {
  const BottomNav({super.key, required this.location});

  final String location;

  static const _tabs = [
    _NavTab(path: AppRoutes.today, icon: Icons.home_outlined, label: 'Today'),
    _NavTab(
      path: AppRoutes.journal,
      icon: Icons.menu_book_outlined,
      label: 'Journal',
    ),
    _NavTab(
      path: AppRoutes.browse,
      icon: Icons.grid_view_rounded,
      label: 'Browse',
    ),
    _NavTab(icon: Icons.menu_rounded, label: 'More'),
  ];

  bool _isActive(_NavTab tab) {
    final path = tab.path;
    if (path == null) return false;
    if (path == AppRoutes.today) {
      return location == AppRoutes.today ||
          location.startsWith('${AppRoutes.today}/');
    }
    if (path == AppRoutes.journal) {
      return location == AppRoutes.journal ||
          location.startsWith('${AppRoutes.journal}/');
    }
    if (path == AppRoutes.browse) {
      final onToday = location == AppRoutes.today ||
          location.startsWith('${AppRoutes.today}/');
      final onJournal = location == AppRoutes.journal ||
          location.startsWith('${AppRoutes.journal}/');
      return !onToday && !onJournal;
    }
    return location == path || location.startsWith('$path/');
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    final bottomPadding = bottomInset > 10 ? bottomInset : 10.0;
    final layout = PurpleTokens.fallback.layout;
    final horizontalInset = layout.pagePaddingX;

    return SafeArea(
      top: false,
      minimum: EdgeInsets.fromLTRB(
        horizontalInset,
        0,
        horizontalInset,
        bottomPadding,
      ),
      child: Material(
        type: MaterialType.transparency,
        clipBehavior: Clip.none,
        child: Align(
          alignment: Alignment.bottomCenter,
          widthFactor: 1,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: purpleMaxContentWidth),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: GlassSurface(
                variant: GlassMaterialVariant.nav,
                borderRadius: BorderRadius.circular(28),
                includeHighlight: true,
                padding: const EdgeInsets.fromLTRB(4, 8, 4, 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    for (final tab in _tabs)
                      Expanded(
                        child: _TabButton(
                          tab: tab,
                          active: _isActive(tab),
                          onTap: tab.path == null
                              ? () => showPloyMoreSheet(context)
                              : () => context.go(tab.path!),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.tab,
    required this.active,
    required this.onTap,
  });

  final _NavTab tab;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? PloyColors.accent : PloyColors.muted;

    return Semantics(
      button: true,
      selected: active,
      label: tab.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 60),
            child: Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 140),
                    curve: Curves.easeOutCubic,
                    width: 44,
                    height: 30,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(15),
                      color: active ? PloyColors.tint : Colors.transparent,
                    ),
                    child: Center(
                      child: Icon(tab.icon, size: 22, color: color),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    tab.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    softWrap: false,
                    style: TextStyle(
                      fontSize: 11,
                      height: 1.2,
                      fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                      color: color,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MoreDestination {
  const _MoreDestination({
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

const _moreDestinations = [
  _MoreDestination(
    label: 'Account and profile',
    detail: 'Region, session, and account details',
    path: AppRoutes.account,
    icon: Icons.person_outline,
  ),
  _MoreDestination(
    label: 'Privacy and safety',
    detail: 'Review your data boundaries',
    path: AppRoutes.settingsPrivacy,
    icon: Icons.verified_user_outlined,
  ),
  _MoreDestination(
    label: 'Sharing and caregivers',
    detail: 'Manage read-only access',
    path: AppRoutes.settingsSharing,
    icon: Icons.share_outlined,
  ),
  _MoreDestination(
    label: 'Your data',
    detail: 'Sources and export controls',
    path: AppRoutes.data,
    icon: Icons.storage_outlined,
  ),
  _MoreDestination(
    label: 'Travel planning',
    detail: 'Preview schedule timing',
    path: AppRoutes.settingsTravel,
    icon: Icons.flight_takeoff,
  ),
  _MoreDestination(
    label: 'All settings',
    detail: 'Open every PurpleLife control',
    path: AppRoutes.settings,
    icon: Icons.settings_outlined,
  ),
];

void showPloyMoreSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    backgroundColor: PloyColors.surface,
    builder: (sheetContext) {
      final bottom = MediaQuery.paddingOf(sheetContext).bottom;
      return SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: EdgeInsets.fromLTRB(8, 0, 8, bottom + 12),
          children: [
            for (final item in _moreDestinations)
              ListTile(
                leading: Icon(item.icon, color: PloyColors.accent),
                title: Text(
                  item.label,
                  style: TextStyle(
                    color: PloyColors.ink,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                subtitle: Text(
                  item.detail,
                  style: TextStyle(color: PloyColors.muted),
                ),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  context.go(item.path);
                },
              ),
          ],
        ),
      );
    },
  );
}

/// Bottom inset for tabbed shell body. Matches the Ploy tab bar, no center FAB.
double shellTabBarInset(BuildContext context) {
  const navBarHeight = 64.0;
  final bottomInset = MediaQuery.paddingOf(context).bottom;
  final safeBottom = bottomInset > 10 ? bottomInset : 10.0;
  return navBarHeight + safeBottom + 8;
}
