import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/glass_surface.dart';
import '../../shell/bottom_nav.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart' hide GlassSurface;
import '../shared/loading_skeleton.dart';
import '../shared/narrative_block.dart';
import 'dose_list.dart';
import 'med_refill_sheet.dart';
import 'medication_form_sheet.dart';
import 'meds_repository.dart';
import 'meds_style.dart';
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

  /// Empty = today in profile timezone (web `viewDate || todayStr`).
  String? _viewDateYmd;

  String? get _scheduleKey => _viewDateYmd;

  Future<void> _refresh() async {
    ref.invalidate(medsScheduleProvider(_scheduleKey));
    ref.invalidate(medsDataProvider);
    try {
      await ref.read(medsScheduleProvider(_scheduleKey).future);
    } catch (_) {
      // Keep pull-to-refresh stable even if a provider failure slips through.
    }
    if (!mounted) return;
    setState(() => _refreshSignal += 1);
  }

  void _setViewDate(String dateYmd, {required String todayStr}) {
    setState(() {
      _viewDateYmd = dateYmd == todayStr ? null : dateYmd;
      _refreshSignal += 1;
    });
    ref.invalidate(medsScheduleProvider(_scheduleKey));
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
    final names = ref
            .read(medsDataProvider)
            .asData
            ?.value
            .medications
            .map((m) => m.name)
            .where((n) => n.trim().isNotEmpty)
            .toList() ??
        const <String>[];
    final saved = await MedicationFormSheet.show(
      context,
      userMedNames: names,
    );
    if (saved == true) await _refresh();
  }

  void _showWebOnlyEntry(String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature is available on web for now.'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  /// Grouped section order and labels matching web KIND_LABEL_KEYS.
  static const _kindSections = [
    ('medication', 'Medications'),
    ('supplement', 'Supplements'),
    ('vitamin', 'Vitamins'),
    ('herbal', 'Herbal'),
    ('rescue', 'Rescue'),
  ];

  void _openMed(Medication medication) {
    context.push(AppRoutes.medDetail(medication.id));
  }

  Future<void> _editMed(Medication medication) async {
    final names = ref
            .read(medsDataProvider)
            .asData
            ?.value
            .medications
            .map((m) => m.name)
            .where((n) => n.trim().isNotEmpty)
            .toList() ??
        const <String>[];
    final saved = await MedicationFormSheet.show(
      context,
      editingMedId: medication.id,
      initialName: medication.name,
      initialKind: medication.kind,
      userMedNames: names,
    );
    if (saved == true) await _refresh();
  }

  /// Opens refill restock sheet (`medications.pills_remaining`).
  Future<void> _openRefill(Medication medication) async {
    final saved = await MedRefillSheet.show(context, medication);
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
    final medsAsync = ref.watch(medsScheduleProvider(_scheduleKey));
    final showMobileFab = MediaQuery.sizeOf(context).width < 768;

    return CanvasBackground(
      child: Stack(
        children: [
          medsAsync.when(
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
            data: (data) {
              return RefreshIndicator(
                onRefresh: _refresh,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: EdgeInsets.only(
                    top: 24,
                    bottom: showMobileFab ? 160 : 120,
                  ),
                  child: ContentColumn(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MedsPageHeader(
                          eyebrow: 'Medications',
                          title: 'Your schedule,\nyour record.',
                          isOffline: data.isOffline,
                          large: !data.hasMeds,
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
                        Align(
                          alignment: Alignment.centerRight,
                          child: _MedsActionsToolbar(
                            onAdd: _openAddMed,
                            onScan: () => _showWebOnlyEntry('Scan label'),
                            onVoice: () => _showWebOnlyEntry('Voice entry'),
                            onHistory: () => context.push(AppRoutes.medsHistory),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TodayDosePanel(
                          doses: data.todayDoses,
                          timezone: data.timezone,
                          todayLabel: data.todayLabel,
                          viewDate: data.viewDateStr,
                          todayStr: data.todayStr,
                          onChangeDate: (date) =>
                              _setViewDate(date, todayStr: data.todayStr),
                          markingAll: _markingAll,
                          adherencePct: data.adherence?.pct,
                          adherenceTaken: data.adherence?.taken ?? 0,
                          adherenceTotal: data.adherence?.total ?? 0,
                          onAddMed: _openAddMed,
                          onOpenMed: _openMed,
                          onRefill: _openRefill,
                          onTaken: (dose) => _doseAction(
                            () => ref
                                .read(medsRepositoryProvider)
                                .markDoseTaken(dose.id),
                          ),
                          onSkip: (dose) => _doseAction(
                            () => ref
                                .read(medsRepositoryProvider)
                                .markDoseSkipped(dose.id),
                          ),
                          onSnooze: (dose) => _doseAction(
                            () => ref
                                .read(medsRepositoryProvider)
                                .snoozeDose(dose.id),
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
                          const MedsSectionEyebrow('All medications'),
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
              );
            },
          ),
          if (showMobileFab)
            Positioned(
              right: 20,
              bottom: shellTabBarInset(context) + 12,
              child: _MedsAddFab(onTap: _openAddMed),
            ),
        ],
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

    final p = MedsPalette.dark();
    if (_tab == 'active' && _filter == 'all') {
      final groups = _groupedMeds(filtered);
      return [
        for (final (kind, label) in _kindSections)
          if (groups[kind]?.isNotEmpty ?? false) ...[
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 8),
              child: MedsSectionEyebrow(label, palette: p),
            ),
            MedLibraryList(
              medications: groups[kind]!,
              nextDoseByMedId: nextDoses,
              onOpenMed: _openMed,
              onMarkTaken: markTaken,
              onEditMed: _editMed,
              onArchiveMed: _archiveMed,
              onRestoreMed: _restoreMed,
              onRefillMed: _openRefill,
            ),
            const SizedBox(height: 24),
          ],
      ];
    }

    if (filtered.isEmpty) {
      return [
        GlassSurface(
          borderRadius: BorderRadius.circular(20),
          padding: const EdgeInsets.all(20),
          child: Text(
            'No medications match this filter',
            style: medsSans(fontSize: 15, color: MedsPalette.dark().textSecondary),
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
        onRefillMed: _openRefill,
      ),
    ];
  }
}

class _MedsActionsToolbar extends StatelessWidget {
  const _MedsActionsToolbar({
    required this.onAdd,
    required this.onScan,
    required this.onVoice,
    required this.onHistory,
  });

  final VoidCallback onAdd;
  final VoidCallback onScan;
  final VoidCallback onVoice;
  final VoidCallback onHistory;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.end,
      children: [
        Tooltip(
          message: 'Add a medication',
          child: FilledButton(
            onPressed: onAdd,
            style: FilledButton.styleFrom(
              minimumSize: const Size(44, 44),
              padding: EdgeInsets.zero,
              shape: const CircleBorder(),
            ),
            child: const Icon(Icons.add, size: 20),
          ),
        ),
        _ToolbarOutlineButton(
          tooltip: 'Scan label',
          icon: Icons.photo_camera_outlined,
          onTap: onScan,
        ),
        _ToolbarOutlineButton(
          tooltip: 'Voice entry',
          icon: Icons.mic_none_outlined,
          onTap: onVoice,
        ),
        _ToolbarOutlineButton(
          tooltip: 'Dose history',
          icon: Icons.history,
          onTap: onHistory,
        ),
      ],
    );
  }
}

class _ToolbarOutlineButton extends StatelessWidget {
  const _ToolbarOutlineButton({
    required this.tooltip,
    required this.icon,
    required this.onTap,
  });

  final String tooltip;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final p = MedsPalette.dark();
    return Tooltip(
      message: tooltip,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(44, 44),
          padding: EdgeInsets.zero,
          shape: const CircleBorder(),
          side: BorderSide(color: p.divider),
          foregroundColor: p.textSecondary,
        ),
        child: Icon(icon, size: 20),
      ),
    );
  }
}

/// Mobile-only FAB matching web `native-fab-fixed` add button.
class _MedsAddFab extends StatelessWidget {
  const _MedsAddFab({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.primary,
      elevation: 8,
      shadowColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.35),
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: const SizedBox(
          width: 56,
          height: 56,
          child: Icon(Icons.add, size: 28, color: Colors.white),
        ),
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
    final p = MedsPalette.dark();
    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: p.divider)),
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
    final p = MedsPalette.dark();
    return InkWell(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              width: 2,
              color: selected ? p.textPrimary : Colors.transparent,
            ),
          ),
        ),
        child: Text(
          label,
          style: medsSans(
            fontSize: 14,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            color: selected ? p.textPrimary : p.textTertiary,
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
    final p = MedsPalette.dark();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: p.purpleSoft.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: p.divider),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24, color: p.textTertiary),
          if (title != null) ...[
            const SizedBox(height: 12),
            Text(
              title!,
              textAlign: TextAlign.center,
              style: medsSerif(fontSize: 22, color: p.textPrimary),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            body,
            textAlign: TextAlign.center,
            style: medsSans(fontSize: 15, color: p.textSecondary),
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
