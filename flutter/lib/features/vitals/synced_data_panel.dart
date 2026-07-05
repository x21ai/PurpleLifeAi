import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import 'synced_data_overview.dart';

/// Which signed-in route is hosting the panel (highlights that chip).
enum SyncedDataAnchor {
  vitals,
  myHealth,
  biometrics,
  tools,
}

/// Full synced-data breakdown: per-source days, last sync, and cross-links.
class SyncedDataPanel extends StatelessWidget {
  const SyncedDataPanel({
    super.key,
    required this.overview,
    this.anchor,
    this.compact = false,
  });

  final SyncedDataOverview overview;
  final SyncedDataAnchor? anchor;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    if (!overview.hasAnyReadings && !overview.hasAnyConnection) {
      return _EmptySyncedPrompt(
        onTools: () => context.go(AppRoutes.tools),
      );
    }

    return GlassSurface(
      padding: EdgeInsets.all(compact ? 14 : 16),
      borderRadius: compact ? 14 : 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.sync,
                size: 16,
                color: Colors.white.withValues(alpha: 0.55),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'ALL SYNCED DATA (${overview.windowDays} DAYS)',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.1,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          for (final row in overview.sources) ...[
            _SourceRow(row: row, compact: compact),
            if (row != overview.sources.last)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Divider(
                  height: 1,
                  color: Colors.white.withValues(alpha: 0.06),
                ),
              ),
          ],
          const SizedBox(height: 14),
          Text(
            'EXPLORE YOUR DATA',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  color: Colors.white.withValues(alpha: 0.4),
                ),
          ),
          const SizedBox(height: 8),
          _LinkGraph(anchor: anchor),
        ],
      ),
    );
  }
}

/// One-line strip for Vitals header with tap-through to My Body.
class SyncedDataCompactStrip extends StatelessWidget {
  const SyncedDataCompactStrip({
    super.key,
    required this.overview,
    this.onTap,
  });

  final SyncedDataOverview overview;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final summary = overview.sources
        .where((s) => s.hasReadings)
        .map((s) => '${s.label} ${s.coverageDays}d')
        .join(' · ');

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap ?? () => context.go(AppRoutes.myHealth),
        borderRadius: BorderRadius.circular(14),
        child: GlassSurface(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          borderRadius: 14,
          child: Row(
            children: [
              Icon(
                Icons.sync,
                size: 16,
                color: Colors.white.withValues(alpha: 0.55),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  summary.isEmpty
                      ? 'Connected devices · tap for full breakdown'
                      : 'Synced last ${overview.windowDays} days · $summary',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.65),
                        height: 1.35,
                      ),
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 16,
                color: Colors.white.withValues(alpha: 0.4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SourceRow extends StatelessWidget {
  const _SourceRow({required this.row, required this.compact});

  final SyncedSourceRow row;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );
    final syncLabel = row.lastSyncAt != null
        ? 'Last synced ${syncedRelativeTime(row.lastSyncAt)}'
        : row.connected
            ? 'Connected · no readings yet'
            : 'Not connected';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                row.label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.9),
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                syncLabel,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.5),
                      height: 1.3,
                    ),
              ),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              row.hasReadings
                  ? '${row.coverageDays} day${row.coverageDays == 1 ? '' : 's'}'
                  : '–',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: row.hasReadings
                        ? purple
                        : Colors.white.withValues(alpha: 0.35),
                    fontWeight: FontWeight.w600,
                  ),
            ),
            if (!compact && row.hasReadings)
              Text(
                'of readings',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.35),
                    ),
              ),
          ],
        ),
      ],
    );
  }
}

class _LinkGraph extends StatelessWidget {
  const _LinkGraph({this.anchor});

  final SyncedDataAnchor? anchor;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _LinkChip(
          label: 'Vitals',
          route: AppRoutes.vitals,
          active: anchor == SyncedDataAnchor.vitals,
        ),
        _LinkChip(
          label: 'My Body',
          route: AppRoutes.myHealth,
          active: anchor == SyncedDataAnchor.myHealth,
        ),
        _LinkChip(
          label: 'Biometrics',
          route: AppRoutes.biometrics,
          active: anchor == SyncedDataAnchor.biometrics,
        ),
        _LinkChip(
          label: 'Tools',
          route: AppRoutes.tools,
          active: anchor == SyncedDataAnchor.tools,
        ),
      ],
    );
  }
}

class _LinkChip extends StatelessWidget {
  const _LinkChip({
    required this.label,
    required this.route,
    required this.active,
  });

  final String label;
  final String route;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );
    return ActionChip(
      onPressed: active ? null : () => context.go(route),
      label: Text(label),
      labelStyle: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: active
                ? Colors.white.withValues(alpha: 0.95)
                : Colors.white.withValues(alpha: 0.75),
            fontWeight: active ? FontWeight.w600 : FontWeight.w500,
          ),
      backgroundColor: active
          ? purple.withValues(alpha: 0.22)
          : Colors.white.withValues(alpha: 0.06),
      side: BorderSide(
        color: active
            ? purple.withValues(alpha: 0.45)
            : Colors.white.withValues(alpha: 0.1),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}

class _EmptySyncedPrompt extends StatelessWidget {
  const _EmptySyncedPrompt({required this.onTools});

  final VoidCallback onTools;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(16),
      borderRadius: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ALL SYNCED DATA',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Connect Oura, Whoop, or Apple Health in Tools. Your readings show up here once synced.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                  height: 1.4,
                ),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: onTools,
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Open Tools'),
          ),
        ],
      ),
    );
  }
}
