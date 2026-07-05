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
                // Caregiver biometric logging on the owner's behalf is a
                // scope-audited server write (web `addBiometric` /
                // AddBiometricSheet) with no Flutter-callable route yet.
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Logging on their behalf is being enabled. '
                      'Use the Purple web app for now.',
                    ),
                    duration: Duration(seconds: 3),
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
        // Genuinely reachable client-side today via `careBiometricsProvider`
        // (direct RLS-safe read of the owner's `biometrics` rows).
        return _BiometricsTab(ownerId: ownerId);
      case CareTabKey.today:
        return const _CaregiverAccessGate(
          eyebrow: 'Today',
          feature: "their risk forecast and alerts",
        );
      case CareTabKey.meds:
        return const _CaregiverAccessGate(
          eyebrow: 'Meds',
          feature: "their medications and today's doses",
        );
      case CareTabKey.hydration:
        return const _CaregiverAccessGate(
          eyebrow: 'Hydration',
          feature: "their hydration timeline",
        );
      case CareTabKey.journal:
        return const _CaregiverAccessGate(
          eyebrow: 'Journal',
          feature: 'their recent journal entries',
        );
      case CareTabKey.seizures:
        return const _CaregiverAccessGate(
          eyebrow: 'Seizures',
          feature: 'their seizure log',
        );
      case CareTabKey.reports:
        return const _CaregiverAccessGate(
          eyebrow: 'Reports',
          feature: 'their lab reports',
        );
      case CareTabKey.chat:
        return const _CaregiverAccessGate(
          eyebrow: 'Chat',
          feature: 'a private message thread with them',
        );
    }
  }
}

/// Definition of a wearable metric fetched by `loadOwnerBiometrics`.
class _BioMetric {
  const _BioMetric({
    required this.column,
    required this.label,
    this.unit,
  });

  final String column;
  final String label;
  final String? unit;
}

/// Metrics that map to the columns `CareRepository.loadOwnerBiometrics`
/// actually selects. Kept in sync with that select list so we never render a
/// tile with no backing data.
const _bioMetrics = <_BioMetric>[
  _BioMetric(column: 'oura_readiness_score', label: 'Readiness'),
  _BioMetric(column: 'sleep_score', label: 'Sleep'),
  _BioMetric(column: 'oura_activity_score', label: 'Activity'),
  _BioMetric(column: 'hrv_rmssd_ms', label: 'HRV', unit: 'ms'),
  _BioMetric(column: 'resting_hr_bpm', label: 'Resting HR', unit: 'bpm'),
  _BioMetric(column: 'steps', label: 'Steps'),
];

/// Biometrics tab — the one caregiver-scoped read that is genuinely reachable
/// client-side today (RLS-safe direct read of the owner's `biometrics`).
///
/// Improvement over the prior placeholder: renders one card per metric with
/// the latest value, its date, and the 30-day range, instead of repeating the
/// readiness score across eight identical tiles.
class _BiometricsTab extends ConsumerWidget {
  const _BiometricsTab({required this.ownerId});

  final String ownerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final biometricsAsync = ref.watch(careBiometricsProvider(ownerId));

    return biometricsAsync.when(
      loading: () =>
          const LoadingSkeleton(sectionTitle: 'Biometrics', tileCount: 4),
      error: (_, __) => const EmptyState(
        eyebrow: 'Biometrics',
        title: 'No biometrics yet',
        body: 'Pull to refresh after they connect a wearable.',
      ),
      data: (snapshot) {
        if (!snapshot.scopeGranted) {
          return const _CaregiverAccessGate(
            eyebrow: 'Biometrics',
            feature: 'their biometrics',
            noScope: true,
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

        final width = MediaQuery.sizeOf(context).width;
        final columns = width < 400 ? 2 : (width < 700 ? 2 : 3);

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
            Text(
              'Last 30 days',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.1,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: columns,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1.4,
              ),
              itemCount: _bioMetrics.length,
              itemBuilder: (context, index) {
                return _BiometricMetricCard(
                  metric: _bioMetrics[index],
                  rows: snapshot.rows,
                );
              },
            ),
          ],
        );
      },
    );
  }
}

class _BiometricMetricCard extends StatelessWidget {
  const _BiometricMetricCard({required this.metric, required this.rows});

  final _BioMetric metric;
  final List<Map<String, dynamic>> rows;

  double? _numeric(Object? raw) {
    if (raw is num) return raw.toDouble();
    if (raw is String) return double.tryParse(raw);
    return null;
  }

  String _fmt(double value) => value.round().toString();

  @override
  Widget build(BuildContext context) {
    // rows arrive ascending by recorded_at; walk backwards for latest non-null.
    double? latest;
    String? latestDate;
    double? min;
    double? max;

    for (var i = rows.length - 1; i >= 0; i--) {
      final value = _numeric(rows[i][metric.column]);
      if (value == null) continue;
      latest ??= value;
      latestDate ??= (rows[i]['recorded_at'] as String?)?.split('T').first;
      min = (min == null || value < min) ? value : min;
      max = (max == null || value > max) ? value : max;
    }

    final valueText = latest != null
        ? '${_fmt(latest)}${metric.unit != null ? ' ${metric.unit}' : ''}'
        : '–';
    final hasData = latest != null;

    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            metric.label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                ),
          ),
          const Spacer(),
          Text(
            valueText,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.95),
                  fontFamily: PurpleType.serif,
                ),
          ),
          const SizedBox(height: 4),
          if (hasData && min != null && max != null && min != max)
            Text(
              'Range ${_fmt(min)}–${_fmt(max)}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
            )
          else if (latestDate != null)
            Text(
              latestDate,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
            )
          else
            Text(
              'No readings',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.4),
                  ),
            ),
        ],
      ),
    );
  }
}

/// Honest gap state for caregiver-scoped tabs whose data is not reachable from
/// Flutter today. The web versions read through scope-guarded server functions
/// (`caregiverReadToday/Meds/Journal/Seizures/Reports`, hydration/aura reads,
/// and the care-chat thread fn) that run on `supabaseAdmin` behind
/// `assertScope`. Flutter has no server-fn client and RLS blocks a caregiver
/// from reading another user's rows directly, so we cannot honestly populate
/// these here without a server route. No fabricated data, no RLS bypass.
class _CaregiverAccessGate extends StatelessWidget {
  const _CaregiverAccessGate({
    required this.eyebrow,
    required this.feature,
    this.noScope = false,
  });

  final String eyebrow;

  /// Human phrase for what would appear, e.g. "their medications".
  final String feature;

  /// When true, the caregiver simply lacks the read scope (a permissions
  /// message) rather than the feature being backend-blocked.
  final bool noScope;

  @override
  Widget build(BuildContext context) {
    if (noScope) {
      return EmptyState(
        eyebrow: eyebrow,
        title: 'No access to $feature',
        body:
            'You do not have read access for this. Ask them to grant it in '
            'Settings, Sharing.',
      );
    }

    return EmptyState(
      eyebrow: eyebrow,
      title: 'Caregiver access is being enabled',
      body:
          'Securely showing $feature here needs scope-checked access with '
          'privacy auditing. That access is being turned on. In the meantime, '
          'you can view it on the Purple web app.',
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
