import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import '../shared/narrative_block.dart';
import '../vitals/sync_status_bar.dart';
import 'dose_list.dart';
import 'medication_form_sheet.dart';
import 'meds_repository.dart';
import 'models/dose.dart';
import 'models/medication.dart';

/// Meds page ported from web `src/routes/_app/meds.tsx`: serif header,
/// Today's doses panel, Active/Archive tabs, kind filters, grouped library.
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

  /// Grouped section order and labels matching web KIND_LABEL_KEYS.
  static const _kindSections = [
    ('medication', 'Medications'),
    ('supplement', 'Supplements'),
    ('vitamin', 'Vitamins'),
    ('herbal', 'Herbal'),
    ('rescue', 'Rescue'),
  ];

  Future<void> _refresh() async {
    ref.invalidate(medsDataProvider);
    try {
      await ref.read(medsDataProvider.future);
    } catch (_) {
      // Keep pull-to-refresh stable even if a provider failure slips through.
    }
    if (!mounted) return;
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
          SnackBar(
            content: Text(successMessage),
            duration: const Duration(seconds: 2),
          ),
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

  Future<void> _openAddMed() async {
    final saved = await MedicationFormSheet.show(context);
    if (saved == true) await _refresh();
  }

  void _openMed(Medication medication) {
    context.push(AppRoutes.medDetail(medication.id));
  }

  Future<void> _editMed(Medication medication) async {
    final saved = await MedicationFormSheet.show(
      context,
      editingMedId: medication.id,
      initialName: medication.name,
      initialKind: medication.kind,
    );
    if (saved == true) await _refresh();
  }

  Future<void> _archiveMed(Medication medication) async {
    try {
      await ref
          .read(medsRepositoryProvider)
          .updateMedicationActive(medication.id, active: false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${medication.name} archived')),
      );
      await _refresh();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not archive medication')),
      );
    }
  }

  Future<void> _restoreMed(Medication medication) async {
    try {
      await ref
          .read(medsRepositoryProvider)
          .updateMedicationActive(medication.id, active: true);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${medication.name} restored')),
      );
      await _refresh();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not restore medication')),
      );
    }
  }

  Future<void> _markAllTaken(MedsData data) async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _markingAll = true);
    try {
      await ref
          .read(medsRepositoryProvider)
          .markAllPendingTaken(data.pendingDoses);
      if (!mounted) return;
      messenger.showSnackBar(
        const SnackBar(content: Text('All pending doses marked taken')),
      );
      await _refresh();
    } catch (_) {
      if (!mounted) return;
      messenger.showSnackBar(
        const SnackBar(content: Text('Could not mark doses')),
      );
    } finally {
      if (mounted) setState(() => _markingAll = false);
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

  /// Kind -> meds map for the grouped active/all view (web groupedMeds).
  Map<String, List<Medication>> _groupedMeds(List<Medication> meds) {
    final groups = <String, List<Medication>>{};
    for (final med in meds) {
      final key = med.isRescueMed ? 'rescue' : med.kind;
      groups.putIfAbsent(key, () => []).add(med);
    }
    return groups;
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
            child: _MedsEmptyCard(
              icon: Icons.medication_outlined,
              title: 'Add the medications you take.',
              body: 'I will remind you and watch for missed doses.',
              actionLabel: 'Refresh',
              onAction: _refresh,
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
                  _MedsHeader(
                    isOffline: data.isOffline,
                    hasLibrary: data.hasMeds,
                  ),
                  if (!data.hasMeds) ...[
                    const SizedBox(height: 24),
                    const NarrativeBlock(
                      text:
                          "Tap a med to see how you've been doing. Purple keeps "
                          'a quiet ledger and nudges only when it matters.',
                    ),
                  ],
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: SyncStatusBar(refreshSignal: _refreshSignal),
                      ),
                      Tooltip(
                        message: 'Dose history',
                        child: OutlinedButton(
                          onPressed: () => context.push(AppRoutes.medsHistory),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(44, 44),
                            padding: EdgeInsets.zero,
                            shape: const CircleBorder(),
                            side: BorderSide(
                              color: Colors.white.withValues(alpha: 0.18),
                            ),
                          ),
                          child: const Icon(Icons.history, size: 20),
                        ),
                      ),
                      const SizedBox(width: 12),
                      _AddMedButton(onTap: _openAddMed),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TodayDosePanel(
                    doses: data.todayDoses,
                    timezone: data.timezone,
                    todayLabel: data.todayLabel,
                    markingAll: _markingAll,
                    adherencePct: data.adherence?.pct,
                    adherenceTaken: data.adherence?.taken ?? 0,
                    adherenceTotal: data.adherence?.total ?? 0,
                    onAddMed: _openAddMed,
                    onOpenMed: _openMed,
                    onTaken: (dose) => _doseAction(
                      () =>
                          ref.read(medsRepositoryProvider).markDoseTaken(dose.id),
                    ),
                    onSkip: (dose) => _doseAction(
                      () => ref
                          .read(medsRepositoryProvider)
                          .markDoseSkipped(dose.id),
                    ),
                    onSnooze: (dose) => _doseAction(
                      () => ref.read(medsRepositoryProvider).snoozeDose(dose.id),
                      successMessage: 'Snoozed 10 min',
                    ),
                    onReclassify: (dose, next) => _doseAction(
                      () => ref
                          .read(medsRepositoryProvider)
                          .reclassifyDose(dose.id, next),
                      successMessage: next == 'taken'
                          ? 'Marked as taken'
                          : next == 'skipped'
                              ? 'Marked as skipped'
                              : 'Reset to pending',
                    ),
                    onMarkAllTaken: data.pendingDoses.isEmpty
                        ? null
                        : () => _markAllTaken(data),
                  ),
                  if (data.medications.isNotEmpty) ...[
                    const SizedBox(height: 40),
                    Text(
                      'ALL MEDICATIONS',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            letterSpacing: 1.2,
                            color: Colors.white.withValues(alpha: 0.45),
                          ),
                    ),
                    const SizedBox(height: 12),
                    _TabBarUnderline(
                      tab: _tab,
                      archivedCount: data.archivedMeds.length,
                      onChanged: (value) => setState(() => _tab = value),
                    ),
                    if (_tab == 'active' && data.activeMeds.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      MedFilterChips(
                        selected: _filter,
                        onChanged: (value) => setState(() => _filter = value),
                      ),
                    ],
                    const SizedBox(height: 16),
                    Text(
                      'Tap a medication to see its dose history, edit the '
                      'dose, or archive it.',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.5),
                          ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  ..._buildLibrary(context, data),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _buildLibrary(BuildContext context, MedsData data) {
    if (data.medications.isEmpty) {
      return [
        const SizedBox(height: 24),
        _MedsEmptyCard(
          icon: Icons.medication_outlined,
          title: 'Add the medications you take.',
          body: 'I will remind you and watch for missed doses.',
          actionLabel: 'Add a medication',
          onAction: _openAddMed,
        ),
      ];
    }

    if (_tab == 'archive' && data.archivedMeds.isEmpty) {
      return [
        const _MedsEmptyCard(
          icon: Icons.inventory_2_outlined,
          body: 'No archived medications.',
        ),
      ];
    }

    final filtered = _filteredMeds(data);
    final nextDoses = data.nextPendingDoseByMedId;

    void markTaken(MedicationDose dose) {
      _doseAction(
        () => ref.read(medsRepositoryProvider).markDoseTaken(dose.id),
      );
    }

    if (_tab == 'active' && _filter == 'all') {
      final groups = _groupedMeds(filtered);
      return [
        for (final (kind, label) in _kindSections)
          if (groups[kind]?.isNotEmpty ?? false) ...[
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 8),
              child: Text(
                label.toUpperCase(),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
            ),
            MedLibraryList(
              medications: groups[kind]!,
              nextDoseByMedId: nextDoses,
              onOpenMed: _openMed,
              onMarkTaken: markTaken,
              onEditMed: _editMed,
              onArchiveMed: _archiveMed,
              onRestoreMed: _restoreMed,
            ),
            const SizedBox(height: 24),
          ],
      ];
    }

    if (filtered.isEmpty) {
      return [
        GlassSurface(
          child: Text(
            'No medications match this filter',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.65),
                ),
          ),
        ),
      ];
    }

    return [
      MedLibraryList(
        medications: filtered,
        nextDoseByMedId: nextDoses,
        onOpenMed: _openMed,
        onMarkTaken: markTaken,
        onEditMed: _editMed,
        onArchiveMed: _archiveMed,
        onRestoreMed: _restoreMed,
      ),
    ];
  }
}

class _MedsHeader extends StatelessWidget {
  const _MedsHeader({required this.isOffline, required this.hasLibrary});

  final bool isOffline;
  final bool hasLibrary;

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
                'MEDICATIONS',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Your schedule,\nyour record.',
                style: (hasLibrary
                        ? Theme.of(context).textTheme.headlineMedium
                        : Theme.of(context).textTheme.displaySmall)
                    ?.copyWith(
                  fontFamily: PurpleType.serif,
                  height: 1.02,
                  letterSpacing: -0.5,
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

/// Round "+" add-medication entry point matching the web actions toolbar.
class _AddMedButton extends StatelessWidget {
  const _AddMedButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: 'Add a medication',
      child: FilledButton(
        onPressed: onTap,
        style: FilledButton.styleFrom(
          minimumSize: const Size(44, 44),
          padding: EdgeInsets.zero,
          shape: const CircleBorder(),
        ),
        child: const Icon(Icons.add, size: 20),
      ),
    );
  }
}

/// Active/Archive underline tabs matching the web tab bar.
class _TabBarUnderline extends StatelessWidget {
  const _TabBarUnderline({
    required this.tab,
    required this.archivedCount,
    required this.onChanged,
  });

  final String tab;
  final int archivedCount;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
        ),
      ),
      child: Row(
        children: [
          _UnderlineTab(
            label: 'Active',
            selected: tab == 'active',
            onTap: () => onChanged('active'),
          ),
          _UnderlineTab(
            label: archivedCount > 0 ? 'Archive ($archivedCount)' : 'Archive',
            selected: tab == 'archive',
            onTap: () => onChanged('archive'),
          ),
        ],
      ),
    );
  }
}

class _UnderlineTab extends StatelessWidget {
  const _UnderlineTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              width: 2,
              color: selected
                  ? Colors.white.withValues(alpha: 0.95)
                  : Colors.transparent,
            ),
          ),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Colors.white.withValues(alpha: selected ? 0.95 : 0.55),
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              ),
        ),
      ),
    );
  }
}

/// Dashed-style empty card matching web empty/no-archived states.
class _MedsEmptyCard extends StatelessWidget {
  const _MedsEmptyCard({
    required this.icon,
    required this.body,
    this.title,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String? title;
  final String body;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24, color: Colors.white.withValues(alpha: 0.55)),
          if (title != null) ...[
            const SizedBox(height: 12),
            Text(
              title!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontFamily: PurpleType.serif,
                    color: Colors.white.withValues(alpha: 0.95),
                  ),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            body,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.65),
                ),
          ),
          if (actionLabel != null) ...[
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onAction,
              style: FilledButton.styleFrom(
                minimumSize: const Size(0, 44),
                shape: const StadiumBorder(),
              ),
              icon: const Icon(Icons.add, size: 16),
              label: Text(actionLabel!),
            ),
          ],
        ],
      ),
    );
  }
}
