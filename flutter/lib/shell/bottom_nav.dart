import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../design/glass_surface.dart';
import '../design/purple_theme.dart';
import '../design/tokens.dart';
import 'routes.dart';

class _NavTab {
  const _NavTab({
    required this.path,
    required this.icon,
    required this.label,
  });

  final String path;
  final IconData icon;
  final String label;
}

/// Frosted glass tab bar with center FAB (ports bottom-nav.tsx native variant).
class BottomNav extends StatelessWidget {
  const BottomNav({super.key, required this.location});

  final String location;

  static const _tabs = [
    _NavTab(path: AppRoutes.today, icon: Icons.wb_sunny_outlined, label: 'Today'),
    _NavTab(
      path: AppRoutes.myHealth,
      icon: Icons.monitor_heart_outlined,
      label: 'My Body',
    ),
    _NavTab(path: AppRoutes.meds, icon: Icons.medication_outlined, label: 'Meds'),
    _NavTab(
      path: AppRoutes.settings,
      icon: Icons.settings_outlined,
      label: 'Settings',
    ),
  ];

  bool _isActive(String path) {
    if (path == AppRoutes.myHealth) {
      return location == AppRoutes.myHealth ||
          location == AppRoutes.vitals ||
          location.startsWith('${AppRoutes.vitals}/');
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
              clipBehavior: Clip.none,
              borderRadius: BorderRadius.circular(28),
              child: GlassSurface(
                variant: GlassMaterialVariant.nav,
                borderRadius: BorderRadius.circular(28),
                includeHighlight: true,
                padding: const EdgeInsets.fromLTRB(4, 8, 4, 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(child: _TabButton(tab: _tabs[0], active: _isActive(_tabs[0].path))),
                    Expanded(child: _TabButton(tab: _tabs[1], active: _isActive(_tabs[1].path))),
                    const Expanded(child: _CaptureFab()),
                    Expanded(child: _TabButton(tab: _tabs[2], active: _isActive(_tabs[2].path))),
                    Expanded(child: _TabButton(tab: _tabs[3], active: _isActive(_tabs[3].path))),
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
  const _TabButton({required this.tab, required this.active});

  final _NavTab tab;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final color = active ? PurpleColors.purplePrimary : PurpleColors.foregroundTertiary;

    return Semantics(
      button: true,
      selected: active,
      label: tab.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.go(tab.path),
          borderRadius: BorderRadius.circular(16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 60),
            child: Padding(
              padding: const EdgeInsets.only(top: 2, bottom: 0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Web `nav-glass-tab-active`: active icon sits in a soft
                  // purple pill and reads heavier than inactive tabs.
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 140),
                    curve: Curves.easeOutCubic,
                    width: 44,
                    height: 30,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(15),
                      color: active
                          ? PurpleColors.purplePrimary.withValues(alpha: 0.14)
                          : Colors.transparent,
                    ),
                    child: Center(
                      child: Icon(tab.icon, size: 24, color: color),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    tab.label,
                    maxLines: 1,
                    overflow: TextOverflow.visible,
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

class _CaptureFab extends StatelessWidget {
  const _CaptureFab();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Capture',
      child: Transform.translate(
        offset: const Offset(0, -12),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => context.go(AppRoutes.journalNew),
            customBorder: const CircleBorder(),
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: PurpleColors.purplePrimary,
                border: Border.all(color: PurpleColors.glassNavBorder, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: PurpleColors.purplePrimary.withValues(alpha: 0.4),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: const Icon(
                Icons.add,
                size: 28,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Bottom inset for tabbed shell body (native-nav-inset equivalent).
double shellTabBarInset(BuildContext context) {
  const navBarHeight = 60.0;
  const fabOverflow = 12.0;
  final bottomInset = MediaQuery.paddingOf(context).bottom;
  final safeBottom = bottomInset > 10 ? bottomInset : 10.0;
  return navBarHeight + fabOverflow + safeBottom + 8;
}
