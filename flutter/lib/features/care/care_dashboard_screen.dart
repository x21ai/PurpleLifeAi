import 'package:flutter/material.dart';

import '../../design/purple_theme.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shell/routes.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import '../chat/care_chat_repository.dart';
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
                _TabPanel(overview: overview, tab: current),
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
  const _TabPanel({required this.overview, required this.tab});

  final CareOverview overview;
  final CareTabKey tab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    switch (tab) {
      case CareTabKey.biometrics:
        return _BiometricsTab(ownerId: overview.ownerId);
      case CareTabKey.today:
        return _TodayTab(ownerId: overview.ownerId);
      case CareTabKey.meds:
        return _MedsTab(ownerId: overview.ownerId);
      case CareTabKey.hydration:
        return const _CaregiverAccessGate(
          eyebrow: 'Hydration',
          feature: "their hydration timeline",
        );
      case CareTabKey.journal:
        return _JournalTab(ownerId: overview.ownerId);
      case CareTabKey.seizures:
        return _SeizuresTab(ownerId: overview.ownerId);
      case CareTabKey.reports:
        return _ReportsTab(ownerId: overview.ownerId);
      case CareTabKey.chat:
        return _ChatTab(
          relationshipId: overview.relationshipId,
          ownerName: overview.firstName?.trim().isNotEmpty == true
              ? overview.firstName!.trim()
              : (overview.displayName?.trim().isNotEmpty == true
                  ? overview.displayName!.trim()
                  : 'them'),
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

/// Caregiver "Today" tab: risk forecast + unacknowledged alerts, via
/// `POST /api/care/today` (`caregiverReadToday`).
class _TodayTab extends ConsumerWidget {
  const _TodayTab({required this.ownerId});

  final String ownerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(careTodayProvider(ownerId));
    return async.when(
      loading: () => const LoadingSkeleton(sectionTitle: 'Today', tileCount: 2),
      error: (_, __) => const EmptyState(
        eyebrow: 'Today',
        title: "Couldn't load today",
        body: 'Pull to refresh and try again in a moment.',
      ),
      data: (snapshot) {
        if (!snapshot.scopeGranted) {
          return const _CaregiverAccessGate(
            eyebrow: 'Today',
            feature: 'their risk forecast and alerts',
            noScope: true,
          );
        }
        if (snapshot.loadError != null &&
            snapshot.forecast == null &&
            snapshot.alerts.isEmpty) {
          return EmptyState(
            eyebrow: 'Today',
            title: "Couldn't load today",
            body: snapshot.loadError!,
          );
        }
        final forecast = snapshot.forecast;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (snapshot.isFromCache) const _CachedBanner(),
            if (forecast != null)
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'RISK FORECAST',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            letterSpacing: 1.1,
                            color: Colors.white.withValues(alpha: 0.45),
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${forecast['band'] ?? 'Unknown'} risk',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.95),
                          ),
                    ),
                    if (forecast['risk_score'] != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Score ${forecast['risk_score']}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                      ),
                    ],
                    if ((forecast['ai_narrative'] as String?)
                            ?.trim()
                            .isNotEmpty ==
                        true) ...[
                      const SizedBox(height: 12),
                      Text(
                        (forecast['ai_narrative'] as String).trim(),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.8),
                            ),
                      ),
                    ],
                  ],
                ),
              )
            else
              const EmptyState(
                eyebrow: 'Today',
                title: 'No forecast yet',
                body: "There's no risk forecast for today yet.",
              ),
            const SizedBox(height: 16),
            Text(
              'ALERTS',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.1,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
            ),
            const SizedBox(height: 8),
            if (snapshot.alerts.isEmpty)
              Text(
                'No active alerts.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
              )
            else
              ...snapshot.alerts.map(
                (alert) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: GlassCard(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (alert['title'] as String?) ?? (alert['kind'] as String? ?? 'Alert'),
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        if ((alert['body'] as String?)?.trim().isNotEmpty ==
                            true) ...[
                          const SizedBox(height: 4),
                          Text(
                            (alert['body'] as String).trim(),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.6),
                                ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

/// Caregiver "Meds" tab: active medications + last 7 days of doses, via
/// `POST /api/care/meds` (`caregiverReadMeds`).
class _MedsTab extends ConsumerWidget {
  const _MedsTab({required this.ownerId});

  final String ownerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(careMedsProvider(ownerId));
    return async.when(
      loading: () => const LoadingSkeleton(sectionTitle: 'Meds', tileCount: 3),
      error: (_, __) => const EmptyState(
        eyebrow: 'Meds',
        title: "Couldn't load medications",
        body: 'Pull to refresh and try again in a moment.',
      ),
      data: (snapshot) {
        if (!snapshot.scopeGranted) {
          return const _CaregiverAccessGate(
            eyebrow: 'Meds',
            feature: "their medications and today's doses",
            noScope: true,
          );
        }
        if (snapshot.meds.isEmpty) {
          return EmptyState(
            eyebrow: 'Meds',
            title: 'No active medications',
            body: snapshot.loadError ?? 'Nothing is on their active medication list yet.',
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (snapshot.isFromCache) const _CachedBanner(),
            ...snapshot.meds.map((med) {
              final recentDoses = snapshot.doses
                  .where((d) => d['medication_id'] == med['id'])
                  .take(3)
                  .toList();
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        (med['name'] as String?) ?? 'Medication',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.92),
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                      if ((med['dosage'] as String?)?.trim().isNotEmpty == true)
                        Text(
                          med['dosage'] as String,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.white.withValues(alpha: 0.55),
                              ),
                        ),
                      if (recentDoses.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: recentDoses
                              .map(
                                (dose) => _OutlineBadge(
                                  label:
                                      '${(dose['status'] as String?) ?? 'pending'} '
                                      '${((dose['scheduled_at'] as String?) ?? '').split('T').first}',
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            }),
          ],
        );
      },
    );
  }
}

/// Caregiver "Journal" tab: recent journal entries, via
/// `POST /api/care/journal` (`caregiverReadJournal`).
class _JournalTab extends ConsumerWidget {
  const _JournalTab({required this.ownerId});

  final String ownerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(careJournalProvider(ownerId));
    return async.when(
      loading: () => const LoadingSkeleton(sectionTitle: 'Journal', tileCount: 3),
      error: (_, __) => const EmptyState(
        eyebrow: 'Journal',
        title: "Couldn't load journal entries",
        body: 'Pull to refresh and try again in a moment.',
      ),
      data: (snapshot) {
        if (!snapshot.scopeGranted) {
          return const _CaregiverAccessGate(
            eyebrow: 'Journal',
            feature: 'their recent journal entries',
            noScope: true,
          );
        }
        if (snapshot.entries.isEmpty) {
          return EmptyState(
            eyebrow: 'Journal',
            title: 'No journal entries yet',
            body: snapshot.loadError ?? 'Entries they write will appear here.',
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (snapshot.isFromCache) const _CachedBanner(),
            ...snapshot.entries.map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ((entry['captured_at'] as String?) ?? '').split('T').first,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.45),
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        (entry['ai_summary'] as String?)?.trim().isNotEmpty == true
                            ? (entry['ai_summary'] as String).trim()
                            : ((entry['text'] as String?) ?? '').trim(),
                        maxLines: 4,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.85),
                            ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Caregiver "Seizures" tab: recent seizure log, via
/// `POST /api/care/seizures` (`caregiverReadSeizures`).
class _SeizuresTab extends ConsumerWidget {
  const _SeizuresTab({required this.ownerId});

  final String ownerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(careSeizuresProvider(ownerId));
    return async.when(
      loading: () => const LoadingSkeleton(sectionTitle: 'Seizures', tileCount: 3),
      error: (_, __) => const EmptyState(
        eyebrow: 'Seizures',
        title: "Couldn't load seizure events",
        body: 'Pull to refresh and try again in a moment.',
      ),
      data: (snapshot) {
        if (!snapshot.scopeGranted) {
          return const _CaregiverAccessGate(
            eyebrow: 'Seizures',
            feature: 'their seizure log',
            noScope: true,
          );
        }
        if (snapshot.events.isEmpty) {
          return EmptyState(
            eyebrow: 'Seizures',
            title: 'No seizure events logged',
            body: snapshot.loadError ?? 'Logged events will appear here.',
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (snapshot.isFromCache) const _CachedBanner(),
            ...snapshot.events.map(
              (event) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              ((event['started_at'] as String?) ?? '')
                                  .replaceFirst('T', ' ')
                                  .split('.')
                                  .first,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ),
                          if (event['type'] != null)
                            _OutlineBadge(label: event['type'] as String),
                        ],
                      ),
                      if (event['duration_seconds'] != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Duration ${event['duration_seconds']}s',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.white.withValues(alpha: 0.55),
                              ),
                        ),
                      ],
                      if ((event['notes'] as String?)?.trim().isNotEmpty == true) ...[
                        const SizedBox(height: 6),
                        Text(
                          (event['notes'] as String).trim(),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.white.withValues(alpha: 0.65),
                              ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Caregiver "Reports" tab list: lab report list, via `POST /api/care/reports`
/// (`caregiverReadReports`). Tapping a row opens `CareReportScreen`, which
/// loads the single-report detail (`caregiverReadReport`, PHI-audited).
class _ReportsTab extends ConsumerWidget {
  const _ReportsTab({required this.ownerId});

  final String ownerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(careReportsProvider(ownerId));
    return async.when(
      loading: () => const LoadingSkeleton(sectionTitle: 'Reports', tileCount: 3),
      error: (_, __) => const EmptyState(
        eyebrow: 'Reports',
        title: "Couldn't load reports",
        body: 'Pull to refresh and try again in a moment.',
      ),
      data: (snapshot) {
        if (!snapshot.scopeGranted) {
          return const _CaregiverAccessGate(
            eyebrow: 'Reports',
            feature: 'their lab reports',
            noScope: true,
          );
        }
        if (snapshot.reports.isEmpty) {
          return EmptyState(
            eyebrow: 'Reports',
            title: 'No reports yet',
            body: snapshot.loadError ?? 'Reports they upload will appear here.',
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (snapshot.isFromCache) const _CachedBanner(),
            ...snapshot.reports.map(
              (report) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  padding: const EdgeInsets.all(14),
                  onTap: () => context.go(
                    AppRoutes.careReport(ownerId, report['id'] as String),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              (report['title'] as String?) ??
                                  (report['report_type'] as String?) ??
                                  'Report',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              (report['report_date'] as String?) ??
                                  ((report['created_at'] as String?) ?? '')
                                      .split('T')
                                      .first,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.5),
                                  ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        Icons.chevron_right,
                        color: Colors.white.withValues(alpha: 0.4),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _CachedBanner extends StatelessWidget {
  const _CachedBanner();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        'Showing cached data',
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.5),
            ),
      ),
    );
  }
}

/// Direct chat entry mirroring web `ChatPanel` on `/care/$ownerId`.
class _ChatTab extends ConsumerStatefulWidget {
  const _ChatTab({
    required this.relationshipId,
    required this.ownerName,
  });

  final String relationshipId;
  final String ownerName;

  @override
  ConsumerState<_ChatTab> createState() => _ChatTabState();
}

class _ChatTabState extends ConsumerState<_ChatTab> {
  String? _threadId;
  String? _error;
  var _loading = true;

  @override
  void initState() {
    super.initState();
    _loadThread();
  }

  Future<void> _loadThread() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(careChatRepositoryProvider);
      final threadId =
          await repo.getOrCreateDirectThread(widget.relationshipId);
      if (!mounted) return;
      setState(() {
        _threadId = threadId;
        _loading = false;
      });
    } on CareChatException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not open chat. Try again in a moment.';
        _loading = false;
      });
    }
  }

  void _openChat() {
    final threadId = _threadId;
    if (threadId == null) return;
    context.go('${AppRoutes.chatCare}?thread=$threadId');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'DIRECT CHAT',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 1.1,
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Send a private message to ${widget.ownerName}. Saved like WhatsApp, full history is kept.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.65),
                height: 1.5,
              ),
        ),
        const SizedBox(height: 16),
        if (_loading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          )
        else if (_error != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _error!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.65),
                      height: 1.4,
                    ),
              ),
              const SizedBox(height: 12),
              OutlinedButton(onPressed: _loadThread, child: const Text('Retry')),
            ],
          )
        else
          FilledButton.icon(
            onPressed: _openChat,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(44),
              shape: const StadiumBorder(),
            ),
            icon: const Icon(Icons.message_outlined, size: 18),
            label: Text('Open chat with ${widget.ownerName}'),
          ),
      ],
    );
  }
}

/// Honest gap state for caregiver-scoped tabs whose data is still not
/// reachable from Flutter. Today/Meds/Journal/Seizures/Reports now call the
/// Worker routes (`/api/care/{today,meds,journal,seizures,reports}`) that
/// front the scope-guarded server functions in `care.server.ts`. Hydration
/// and Chat still have no such route (`listHydrationForDay`). Hydration
/// remains blocked by RLS; direct chat uses Supabase RLS via
/// [CareChatRepository.getOrCreateDirectThread].
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
