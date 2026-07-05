import 'package:flutter/material.dart';

import '../../design/purple_theme.dart';
import '../../design/purple_type.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'care_repository.dart';
import 'care_scopes.dart';

/// Caregiver dashboard with unified glass tab toolbar and scoped tab panels.
class CareDashboardScreen extends ConsumerStatefulWidget {
  const CareDashboardScreen({super.key, required this.ownerId});

  final String ownerId;

  @override
  ConsumerState<CareDashboardScreen> createState() => _CareDashboardScreenState();
}

class _CareDashboardScreenState extends ConsumerState<CareDashboardScreen> {
  CareTabKey? _activeTab;

  @override
  Widget build(BuildContext context) {
    final overviewAsync = ref.watch(careOverviewProvider(widget.ownerId));

    return CanvasBackground(
      child: overviewAsync.when(
        loading: () => const SingleChildScrollView(
          padding: EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: LoadingSkeleton(sectionTitle: 'Care dashboard', tileCount: 3),
          ),
        ),
        error: (error, _) => SingleChildScrollView(
          padding: const EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: error is CareAccessException
                ? _NoAccessView(
                    message: error.message,
                    onBack: () => context.go('/care'),
                  )
                : const EmptyState(
                    eyebrow: 'Care',
                    title: 'No care dashboard yet',
                    body: 'Pull to refresh and try again in a moment.',
                  ),
          ),
        ),
        data: (overview) => _DashboardBody(
          overview: overview,
          activeTab: _activeTab,
          onTabChanged: (tab) => setState(() => _activeTab = tab),
          onRefresh: () async {
            ref.invalidate(careOverviewProvider(widget.ownerId));
            ref.invalidate(careBiometricsProvider(widget.ownerId));
            await ref.read(careOverviewProvider(widget.ownerId).future);
          },
          onToggleTabVisibility: (tab, show) async {
            final key = careTabKeyName(tab);
            final hidden = List<String>.from(overview.caregiverHiddenFeatures);
            if (show) {
              hidden.remove(key);
            } else if (!hidden.contains(key)) {
              hidden.add(key);
            }
            await ref.read(careRepositoryProvider).setHiddenFeatures(
                  relationshipId: overview.relationshipId,
                  hidden: hidden,
                );
            ref.invalidate(careOverviewProvider(widget.ownerId));
          },
        ),
      ),
    );
  }
}

class _DashboardBody extends ConsumerWidget {
  const _DashboardBody({
    required this.overview,
    required this.activeTab,
    required this.onTabChanged,
    required this.onRefresh,
    required this.onToggleTabVisibility,
  });

  final CareOverview overview;
  final CareTabKey? activeTab;
  final ValueChanged<CareTabKey> onTabChanged;
  final Future<void> Function() onRefresh;
  final Future<void> Function(CareTabKey tab, bool show) onToggleTabVisibility;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tabs = overview.scopedTabs();
    final ownerAllowed = overview.scopedTabs(respectHidden: false);
    final current = tabs.any((t) => t.key == activeTab)
        ? activeTab!
        : (tabs.isNotEmpty ? tabs.first.key : CareTabKey.today);
    final role = parseCareRole(overview.role);

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go('/care'),
                icon: Icon(Icons.arrow_back, color: Colors.white.withValues(alpha: 0.55)),
                label: Text(
                  'All people',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'CAREGIVER',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                overview.dashboardTitle(),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontFamily: PurpleType.serif,
                      height: 1.04,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  _Badge(
                    label: role != null
                        ? careRoleLabels[role]!
                        : overview.role,
                  ),
                  if (overview.relationshipLabel?.trim().isNotEmpty == true)
                    _OutlineBadge(label: overview.relationshipLabel!.trim()),
                  Text(
                    '${overview.scopes.length} scope${overview.scopes.length == 1 ? '' : 's'} granted',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.5),
                        ),
                  ),
                  if (overview.expiresAt != null)
                    Text(
                      'Access until ${overview.expiresAt!.split('T').first}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.5),
                          ),
                    ),
                  if (overview.isFromCache)
                    Text(
                      'Cached',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.45),
                          ),
                    ),
                ],
              ),
              if (overview.phone?.trim().isNotEmpty == true) ...[
                const SizedBox(height: 16),
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CONTACT',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              letterSpacing: 1.1,
                              color: Colors.white.withValues(alpha: 0.45),
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        overview.phone!.trim(),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.9),
                            ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              if (tabs.isEmpty)
                const EmptyState(
                  eyebrow: 'Care',
                  title: 'No read scopes yet',
                  body:
                      'Ask them to grant access in Settings, Sharing.',
                )
              else ...[
                _CareGlassToolbar(
                  tabs: tabs,
                  ownerAllowedTabs: ownerAllowed,
                  hiddenTabs: overview.caregiverHiddenFeatures.toSet(),
                  current: current,
                  onTabChanged: onTabChanged,
                  onToggleTabVisibility: onToggleTabVisibility,
                  canWriteBiometric: overview.hasScope(CareScopes.biometricsWrite),
                ),
                const SizedBox(height: 20),
                _TabPanel(ownerId: overview.ownerId, tab: current),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _CareGlassToolbar extends StatelessWidget {
  const _CareGlassToolbar({
    required this.tabs,
    required this.ownerAllowedTabs,
    required this.hiddenTabs,
    required this.current,
    required this.onTabChanged,
    required this.onToggleTabVisibility,
    required this.canWriteBiometric,
  });

  final List<CareTabDefinition> tabs;
  final List<CareTabDefinition> ownerAllowedTabs;
  final Set<String> hiddenTabs;
  final CareTabKey current;
  final ValueChanged<CareTabKey> onTabChanged;
  final Future<void> Function(CareTabKey tab, bool show) onToggleTabVisibility;
  final bool canWriteBiometric;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 640;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: GlassSurface(
            padding: const EdgeInsets.all(6),
            borderRadius: 20,
            child: compact
                ? _MobileTabPicker(
                    tabs: tabs,
                    current: current,
                    onChanged: onTabChanged,
                  )
                : _DesktopTabStrip(
                    tabs: tabs,
                    current: current,
                    onChanged: onTabChanged,
                  ),
          ),
        ),
        const SizedBox(width: 8),
        _ToolbarActions(
          ownerAllowedTabs: ownerAllowedTabs,
          hiddenTabs: hiddenTabs,
          current: current,
          canWriteBiometric: canWriteBiometric,
          onToggleTabVisibility: onToggleTabVisibility,
        ),
      ],
    );
  }
}

class _MobileTabPicker extends StatelessWidget {
  const _MobileTabPicker({
    required this.tabs,
    required this.current,
    required this.onChanged,
  });

  final List<CareTabDefinition> tabs;
  final CareTabKey current;
  final ValueChanged<CareTabKey> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonHideUnderline(
      child: DropdownButton<CareTabKey>(
        value: current,
        isExpanded: true,
        dropdownColor: PurpleColors.backgroundTertiary,
        style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
        items: [
          for (final tab in tabs)
            DropdownMenuItem(
              value: tab.key,
              child: Text(tab.label),
            ),
        ],
        onChanged: (value) {
          if (value != null) onChanged(value);
        },
      ),
    );
  }
}

class _DesktopTabStrip extends StatelessWidget {
  const _DesktopTabStrip({
    required this.tabs,
    required this.current,
    required this.onChanged,
  });

  final List<CareTabDefinition> tabs;
  final CareTabKey current;
  final ValueChanged<CareTabKey> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final tab in tabs)
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: _TabChip(
                label: tab.label,
                selected: tab.key == current,
                onTap: () => onChanged(tab.key),
              ),
            ),
        ],
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? Colors.white.withValues(alpha: 0.1)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              color: selected
                  ? Colors.white.withValues(alpha: 0.95)
                  : Colors.white.withValues(alpha: 0.65),
            ),
          ),
        ),
      ),
    );
  }
}

class _ToolbarActions extends StatelessWidget {
  const _ToolbarActions({
    required this.ownerAllowedTabs,
    required this.hiddenTabs,
    required this.current,
    required this.canWriteBiometric,
    required this.onToggleTabVisibility,
  });

  final List<CareTabDefinition> ownerAllowedTabs;
  final Set<String> hiddenTabs;
  final CareTabKey current;
  final bool canWriteBiometric;
  final Future<void> Function(CareTabKey tab, bool show) onToggleTabVisibility;

  @override
  Widget build(BuildContext context) {
    final showAdd = current == CareTabKey.biometrics && canWriteBiometric;

    return GlassSurface(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      borderRadius: 24,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          PopupMenuButton<String>(
            tooltip: 'Customize tabs',
            icon: Icon(
              Icons.visibility_off_outlined,
              size: 18,
              color: Colors.white.withValues(alpha: 0.65),
            ),
            color: PurpleColors.backgroundTertiary,
            onSelected: (value) async {
              final tab = careTabKeyFromName(value);
              if (tab == null) return;
              final shown = !hiddenTabs.contains(value);
              await onToggleTabVisibility(tab, !shown);
            },
            itemBuilder: (context) {
              if (ownerAllowedTabs.isEmpty) {
                return [
                  const PopupMenuItem(
                    enabled: false,
                    child: Text('Nothing to customize.'),
                  ),
                ];
              }
              return [
                const PopupMenuItem(
                  enabled: false,
                  child: Text(
                    'Show tabs (just for you)',
                    style: TextStyle(fontSize: 12),
                  ),
                ),
                for (final tab in ownerAllowedTabs)
                  CheckedPopupMenuItem<String>(
                    value: careTabKeyName(tab.key),
                    checked: !hiddenTabs.contains(careTabKeyName(tab.key)),
                    child: Text(tab.label),
                  ),
              ];
            },
          ),
          if (showAdd) ...[
            Container(
              width: 1,
              height: 20,
              color: Colors.white.withValues(alpha: 0.12),
            ),
            IconButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Add biometric integration point'),
                    duration: Duration(seconds: 1),
                  ),
                );
              },
              icon: const Icon(Icons.add, size: 20),
              color: Colors.white.withValues(alpha: 0.8),
              tooltip: 'Add biometric',
            ),
          ],
        ],
      ),
    );
  }
}

class _TabPanel extends ConsumerWidget {
  const _TabPanel({required this.ownerId, required this.tab});

  final String ownerId;
  final CareTabKey tab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    switch (tab) {
      case CareTabKey.biometrics:
        return _BiometricsPlaceholder(ownerId: ownerId);
      case CareTabKey.today:
        return const _ComingSoonPanel(
          title: 'Today',
          body: 'Risk forecast and active alerts will appear here.',
        );
      case CareTabKey.meds:
        return const _ComingSoonPanel(
          title: 'Meds',
          body: 'Today doses and medication list will appear here.',
        );
      case CareTabKey.hydration:
        return const _ComingSoonPanel(
          title: 'Hydration',
          body: 'Hydration timeline will appear here.',
        );
      case CareTabKey.journal:
        return const _ComingSoonPanel(
          title: 'Journal',
          body: 'Recent journal entries will appear here.',
        );
      case CareTabKey.seizures:
        return const _ComingSoonPanel(
          title: 'Seizures',
          body: 'Seizure events will appear here.',
        );
      case CareTabKey.reports:
        return const _ComingSoonPanel(
          title: 'Reports',
          body: 'Lab reports will appear here.',
        );
      case CareTabKey.chat:
        return const _ComingSoonPanel(
          title: 'Chat',
          body: 'Direct chat with them will appear here.',
        );
    }
  }
}

class _BiometricsPlaceholder extends ConsumerWidget {
  const _BiometricsPlaceholder({required this.ownerId});

  final String ownerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final biometricsAsync = ref.watch(careBiometricsProvider(ownerId));

    return biometricsAsync.when(
      loading: () => const LoadingSkeleton(sectionTitle: 'Biometrics', tileCount: 4),
      error: (_, __) => const EmptyState(
        eyebrow: 'Biometrics',
        title: 'No biometrics yet',
        body: 'Pull to refresh after they connect a wearable.',
      ),
      data: (snapshot) {
        if (!snapshot.scopeGranted) {
          return const _ComingSoonPanel(
            title: 'Biometrics',
            body: 'You do not have biometrics read access for this person.',
          );
        }

        if (snapshot.rows.isEmpty) {
          return EmptyState(
            eyebrow: 'Biometrics',
            title: 'No biometrics yet',
            body: snapshot.loadError ??
                'Once a wearable is connected, the last 30 days appear here.',
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (snapshot.isFromCache)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  'Showing cached biometrics',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                ),
              ),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1.5,
              ),
              itemCount: snapshot.rows.length.clamp(0, 8),
              itemBuilder: (context, index) {
                final row = snapshot.rows[snapshot.rows.length - 1 - index];
                final recordedAt = row['recorded_at'] as String?;
                final readiness = row['oura_readiness_score'];
                return GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Readiness',
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                      const Spacer(),
                      Text(
                        readiness?.toString() ?? '–',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Colors.white.withValues(alpha: 0.95),
                            ),
                      ),
                      if (recordedAt != null)
                        Text(
                          recordedAt.split('T').first,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                    ],
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }
}

class _ComingSoonPanel extends StatelessWidget {
  const _ComingSoonPanel({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.95),
                  fontFamily: PurpleType.serif,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.65),
                ),
          ),
        ],
      ),
    );
  }
}

class _NoAccessView extends StatelessWidget {
  const _NoAccessView({required this.message, required this.onBack});

  final String message;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextButton.icon(
          onPressed: onBack,
          icon: Icon(Icons.arrow_back, color: Colors.white.withValues(alpha: 0.55)),
          label: Text(
            'Back',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'No access',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontFamily: PurpleType.serif,
                color: Colors.white.withValues(alpha: 0.95),
              ),
        ),
        const SizedBox(height: 12),
        Text(
          message,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.65),
              ),
        ),
      ],
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.85),
            ),
      ),
    );
  }
}

class _OutlineBadge extends StatelessWidget {
  const _OutlineBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.75),
            ),
      ),
    );
  }
}
