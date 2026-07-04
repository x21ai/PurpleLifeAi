import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import '../vitals/sync_status_bar.dart';
import 'dose_list.dart';
import 'meds_repository.dart';
import 'models/medication.dart';

/// Meds library with today's doses, filters, and honest empty states.
class MedsScreen extends ConsumerStatefulWidget {
  const MedsScreen({super.key});

  @override
  ConsumerState<MedsScreen> createState() => _MedsScreenState();
}

class _MedsScreenState extends ConsumerState<MedsScreen> {
  String _filter = 'all';
  String _tab = 'active';
  bool _markingAll = false;
  int _refreshSignal = 0;

  Future<void> _refresh() async {
    ref.invalidate(medsDataProvider);
    await ref.read(medsDataProvider.future);
    setState(() => _refreshSignal += 1);
  }

  Future<void> _doseAction(
    Future<void> Function() action, {
    String? successMessage,
  }) async {
    try {
      await action();
      if (successMessage != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(successMessage), duration: const Duration(seconds: 2)),
        );
      }
      await _refresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not update dose')),
        );
      }
    }
  }

  List<Medication> _filteredMeds(MedsData data) {
    final base = _tab == 'active' ? data.activeMeds : data.archivedMeds;
    if (_tab == 'archive' || _filter == 'all') return base;
    if (_filter == 'rescue') {
      return base.where((m) => m.isRescueMed).toList();
    }
    return base.where((m) => m.kind == _filter).toList();
  }

  @override
  Widget build(BuildContext context) {
    final medsAsync = ref.watch(medsDataProvider);

    return CanvasBackground(
      child: medsAsync.when(
        loading: () => const SingleChildScrollView(
          padding: EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: LoadingSkeleton(sectionTitle: 'Meds', tileCount: 3),
          ),
        ),
        error: (_, __) => ContentColumn(
          child: Padding(
            padding: const EdgeInsets.only(top: 24, bottom: 120),
            child: EmptyState(
              eyebrow: 'Meds',
              title: 'Could not load medications',
              body: 'Check your connection and try again.',
              primaryActionLabel: 'Retry',
              onPrimaryAction: _refresh,
            ),
          ),
        ),
        data: (data) => RefreshIndicator(
          onRefresh: _refresh,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(top: 24, bottom: 120),
            child: ContentColumn(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _MedsHeader(isOffline: data.isOffline),
                  const SizedBox(height: 16),
                  SyncStatusBar(refreshSignal: _refreshSignal),
                  const SizedBox(height: 24),
                  if (data.todayDoses.isNotEmpty) ...[
                    TodayDosePanel(
                      doses: data.todayDoses,
                      markingAll: _markingAll,
                      onTaken: (dose) => _doseAction(
                        () => ref.read(medsRepositoryProvider).markDoseTaken(dose.id),
                      ),
                      onSkip: (dose) => _doseAction(
                        () => ref.read(medsRepositoryProvider).markDoseSkipped(dose.id),
                      ),
                      onSnooze: (dose) => _doseAction(
                        () => ref.read(medsRepositoryProvider).snoozeDose(dose.id),
                        successMessage: 'Snoozed 10 min',
                      ),
                      onMarkAllTaken: data.pendingDoses.isEmpty
                          ? null
                          : () async {
                              final messenger = ScaffoldMessenger.of(context);
                              setState(() => _markingAll = true);
                              try {
                                await ref
                                    .read(medsRepositoryProvider)
                                    .markAllPendingTaken(data.pendingDoses);
                                if (!mounted) return;
                                messenger.showSnackBar(
                                  const SnackBar(
                                    content: Text('All pending doses marked taken'),
                                  ),
                                );
                                await _refresh();
                              } catch (_) {
                                if (!mounted) return;
                                messenger.showSnackBar(
                                  const SnackBar(
                                    content: Text('Could not mark doses'),
                                  ),
                                );
                              } finally {
                                if (mounted) setState(() => _markingAll = false);
                              }
                            },
                    ),
                    const SizedBox(height: 32),
                  ],
                  _TabSwitcher(
                    tab: _tab,
                    onChanged: (value) => setState(() => _tab = value),
                  ),
                  const SizedBox(height: 16),
                  if (_tab == 'active') ...[
                    MedFilterChips(
                      selected: _filter,
                      onChanged: (value) => setState(() => _filter = value),
                    ),
                    const SizedBox(height: 16),
                  ],
                  if (!data.hasMeds && _tab == 'active')
                    EmptyState(
                      eyebrow: 'Meds',
                      title: 'No medications yet',
                      body:
                          'Add your prescriptions and supplements so Purple can track doses and patterns.',
                      primaryActionLabel: 'Add medication',
                      onPrimaryAction: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Medication form coming in a later phase'),
                          ),
                        );
                      },
                    )
                  else if (_filteredMeds(data).isEmpty)
                    GlassSurface(
                      child: Text(
                        _tab == 'archive'
                            ? 'No archived medications'
                            : 'No medications match this filter',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.65),
                            ),
                      ),
                    )
                  else ...[
                    Text(
                      _tab == 'active' ? 'YOUR LIBRARY' : 'ARCHIVED',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            letterSpacing: 1.2,
                            color: Colors.white.withValues(alpha: 0.45),
                          ),
                    ),
                    const SizedBox(height: 12),
                    ..._filteredMeds(data).map(
                      (med) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: MedLibraryCard(medication: med),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MedsHeader extends StatelessWidget {
  const _MedsHeader({required this.isOffline});

  final bool isOffline;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'MEDS',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Your\nmedications',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: 'Georgia',
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
            ],
          ),
        ),
        if (isOffline)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
            ),
            child: Text(
              'Offline',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
            ),
          ),
      ],
    );
  }
}

class _TabSwitcher extends StatelessWidget {
  const _TabSwitcher({
    required this.tab,
    required this.onChanged,
  });

  final String tab;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(4),
      borderRadius: 999,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _TabButton(
            label: 'Active',
            selected: tab == 'active',
            onTap: () => onChanged('active'),
          ),
          _TabButton(
            label: 'Archive',
            selected: tab == 'archive',
            onTap: () => onChanged('archive'),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
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
      color: selected
          ? Colors.white.withValues(alpha: 0.14)
          : Colors.transparent,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Colors.white.withValues(alpha: selected ? 0.95 : 0.55),
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                ),
          ),
        ),
      ),
    );
  }
}
