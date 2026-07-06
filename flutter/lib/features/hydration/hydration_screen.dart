import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../design/glass_surface.dart' as merged_glass;
import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import '../shared/merged_style.dart';
import 'hydration_repository.dart';
import 'hydration_style.dart';

/// Hydration day view mirroring web `/hydration` (quick-add, goal ring, timeline).
class HydrationScreen extends ConsumerStatefulWidget {
  const HydrationScreen({super.key});

  @override
  ConsumerState<HydrationScreen> createState() => _HydrationScreenState();
}

class _HydrationScreenState extends ConsumerState<HydrationScreen> {
  DateTime _day = DateTime.now();
  bool _logging = false;

  DateTime get _normalizedDay =>
      DateTime(_day.year, _day.month, _day.day);

  bool get _isToday {
    final now = DateTime.now();
    return _normalizedDay.year == now.year &&
        _normalizedDay.month == now.month &&
        _normalizedDay.day == now.day;
  }

  Future<void> _refresh() async {
    ref.invalidate(hydrationDayProvider(_normalizedDay));
    await ref.read(hydrationDayProvider(_normalizedDay).future);
  }

  Future<void> _log({
    required int volumeMl,
    required String kind,
    String? brand,
    int? sodiumMg,
  }) async {
    if (_logging) return;
    setState(() => _logging = true);
    try {
      await ref.read(hydrationRepositoryProvider).logIntake(
            volumeMl: volumeMl,
            kind: kind,
            electrolyteBrand: brand,
            sodiumMg: sodiumMg,
          );
      ref.invalidate(hydrationDayProvider(_normalizedDay));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              kind == 'water'
                  ? 'Logged $volumeMl ml water'
                  : 'Logged $volumeMl ml ${brand ?? 'electrolytes'}',
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not log intake. Try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _logging = false);
    }
  }

  Future<void> _deleteEntry(String id) async {
    try {
      await ref.read(hydrationRepositoryProvider).deleteEntry(id);
      ref.invalidate(hydrationDayProvider(_normalizedDay));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not remove entry')),
        );
      }
    }
  }

  Future<void> _showCustomWaterDialog() async {
    var volume = 250;
    final result = await showDialog<int>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Add water', style: PurpleType.serifStyle(fontSize: 22)),
          content: StatefulBuilder(
            builder: (context, setDialogState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [200, 250, 330, 500, 750].map((v) {
                      final selected = volume == v;
                      return ChoiceChip(
                        label: Text('$v ml'),
                        selected: selected,
                        onSelected: (_) => setDialogState(() => volume = v),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Custom (ml)'),
                    onChanged: (value) {
                      final parsed = int.tryParse(value);
                      if (parsed != null) setDialogState(() => volume = parsed);
                    },
                  ),
                ],
              );
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: volume > 0 ? () => Navigator.pop(context, volume) : null,
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
    if (result != null && result > 0) {
      await _log(volumeMl: result, kind: 'water');
    }
  }

  Future<void> _showElectrolyteDialog() async {
    const presets = [
      ('LMNT', 1000, 355),
      ('Liquid I.V.', 500, 473),
      ('Pedialyte', 370, 354),
    ];
    var brand = presets.first.$1;
    var sodium = presets.first.$2;
    var volume = presets.first.$3;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(
            'Add electrolytes',
            style: PurpleType.serifStyle(fontSize: 22),
          ),
          content: StatefulBuilder(
            builder: (context, setDialogState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: presets.map((p) {
                      return ChoiceChip(
                        label: Text(p.$1),
                        selected: brand == p.$1,
                        onSelected: (_) => setDialogState(() {
                          brand = p.$1;
                          sodium = p.$2;
                          volume = p.$3;
                        }),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Volume (ml)'),
                    controller: TextEditingController(text: '$volume'),
                    onChanged: (value) {
                      volume = int.tryParse(value) ?? volume;
                    },
                  ),
                ],
              );
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: volume > 0 ? () => Navigator.pop(context, true) : null,
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
    if (result == true) {
      await _log(
        volumeMl: volume,
        kind: 'electrolyte',
        brand: brand,
        sodiumMg: sodium,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final p = mergedPalette();
    final dayAsync = ref.watch(hydrationDayProvider(_normalizedDay));

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: _refresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.only(
            top: tokens.spacing.x2,
            bottom: 120,
          ),
          child: ContentColumn(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MergedBackLink(
                  label: 'Vitals',
                  onPressed: () => context.go(AppRoutes.vitals),
                ),
                const SizedBox(height: 32),
                const HydrationPageHeader(),
                const SizedBox(height: 20),
                _DayPicker(
                  day: _normalizedDay,
                  isToday: _isToday,
                  onPrevious: () => setState(() {
                    _day = _normalizedDay.subtract(const Duration(days: 1));
                  }),
                  onNext: _isToday
                      ? null
                      : () => setState(() {
                            final next = _normalizedDay.add(const Duration(days: 1));
                            final today = DateTime.now();
                            _day = next.isAfter(DateTime(today.year, today.month, today.day))
                                ? DateTime(today.year, today.month, today.day)
                                : next;
                          }),
                ),
                const SizedBox(height: 24),
                dayAsync.when(
                  loading: () => const LoadingSkeleton(
                    sectionTitle: 'Hydration',
                    tileCount: 3,
                  ),
                  error: (_, __) => Text(
                    'Could not load hydration.',
                    style: hydrationSans(color: p.textTertiary),
                  ),
                  data: (data) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _GoalCard(data: data),
                      if (_isToday) ...[
                        const SizedBox(height: 20),
                        _QuickAddRow(
                          logging: _logging,
                          on250: () => _log(volumeMl: 250, kind: 'water'),
                          on500: () => _log(volumeMl: 500, kind: 'water'),
                          onCustomWater: _showCustomWaterDialog,
                          onElectrolyte: _showElectrolyteDialog,
                        ),
                      ],
                      const SizedBox(height: 24),
                      const MergedSectionLabel('Timeline'),
                      const SizedBox(height: 12),
                      if (data.rows.isEmpty)
                        Text(
                          _isToday
                              ? 'Nothing logged yet today.'
                              : 'No intake logged this day.',
                          style: hydrationSans(color: p.textTertiary),
                        )
                      else
                        Column(
                          children: [
                            for (final row in data.rows)
                              _TimelineTile(
                                row: row,
                                onDelete: _isToday
                                    ? () => _deleteEntry(row.id)
                                    : null,
                              ),
                          ],
                        ),
                      if (data.isOffline) ...[
                        const SizedBox(height: 12),
                        Text(
                          'Offline: showing last known goal; timeline may be empty.',
                          style: hydrationSans(fontSize: 12, color: p.textTertiary),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DayPicker extends StatelessWidget {
  const _DayPicker({
    required this.day,
    required this.isToday,
    required this.onPrevious,
    this.onNext,
  });

  final DateTime day;
  final bool isToday;
  final VoidCallback onPrevious;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    final p = mergedPalette();
    final label = DateFormat('EEE, MMM d').format(day);
    return merged_glass.GlassSurface(
      borderRadius: BorderRadius.circular(999),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: onPrevious,
            icon: const Icon(Icons.chevron_left),
            color: p.textSecondary,
          ),
          Text(
            label,
            style: hydrationSans(
              fontWeight: FontWeight.w500,
              color: hydrationBody(),
            ),
          ),
          IconButton(
            onPressed: onNext,
            icon: const Icon(Icons.chevron_right),
            color: p.textSecondary,
          ),
        ],
      ),
    );
  }
}

class _GoalCard extends StatelessWidget {
  const _GoalCard({required this.data});

  final HydrationDayData data;

  @override
  Widget build(BuildContext context) {
    final p = mergedPalette();
    final liters = data.totalMl / 1000;
    final goalLiters = data.goalMl / 1000;
    return merged_glass.GlassSurface(
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${liters.toStringAsFixed(2)} L / ${goalLiters.toStringAsFixed(1)} L',
            style: medsSerif(fontSize: 32, color: p.textPrimary),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: data.progress,
              minHeight: 8,
              backgroundColor: p.divider,
              color: p.purplePrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickAddRow extends StatelessWidget {
  const _QuickAddRow({
    required this.logging,
    required this.on250,
    required this.on500,
    required this.onCustomWater,
    required this.onElectrolyte,
  });

  final bool logging;
  final VoidCallback on250;
  final VoidCallback on500;
  final VoidCallback onCustomWater;
  final VoidCallback onElectrolyte;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        FilledButton.tonal(
          onPressed: logging ? null : on250,
          style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
          child: const Text('250 ml'),
        ),
        FilledButton.tonal(
          onPressed: logging ? null : on500,
          style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
          child: const Text('500 ml'),
        ),
        OutlinedButton(
          onPressed: logging ? null : onCustomWater,
          style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44)),
          child: const Text('Water'),
        ),
        OutlinedButton(
          onPressed: logging ? null : onElectrolyte,
          style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44)),
          child: const Text('Electrolytes'),
        ),
      ],
    );
  }
}

class _TimelineTile extends StatelessWidget {
  const _TimelineTile({required this.row, this.onDelete});

  final HydrationRow row;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final p = mergedPalette();
    final time = DateFormat('h:mm a').format(row.consumedAt);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: merged_glass.GlassSurface(
        borderRadius: BorderRadius.circular(16),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(
              row.kind == 'electrolyte'
                  ? Icons.science_outlined
                  : Icons.water_drop_outlined,
              size: 18,
              color: p.textTertiary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${row.volumeMl} ml · ${row.displayLabel}',
                    style: hydrationSans(color: hydrationBody()),
                  ),
                  Text(
                    time,
                    style: hydrationSans(fontSize: 12, color: p.textTertiary),
                  ),
                ],
              ),
            ),
            if (onDelete != null)
              IconButton(
                onPressed: onDelete,
                icon: Icon(Icons.close, size: 18, color: p.textTertiary),
                tooltip: 'Remove',
              ),
          ],
        ),
      ),
    );
  }
}
