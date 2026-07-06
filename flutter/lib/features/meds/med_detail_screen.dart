import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../design/glass_surface.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart' show CanvasBackground, ContentColumn;
import '../shared/loading_skeleton.dart';
import 'dose_list.dart';
import 'medication_form_sheet.dart';
import 'meds_repository.dart';
import 'meds_style.dart';
import 'models/dose.dart';
import 'models/medication.dart';

/// Medication detail at `/meds/:medId` with schedule and recent doses.
class MedDetailScreen extends ConsumerWidget {
  const MedDetailScreen({super.key, required this.medId});

  final String medId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final medAsync = ref.watch(medicationByIdProvider(medId));
    final dosesAsync = ref.watch(medicationDosesProvider(medId));

    return CanvasBackground(
      child: medAsync.when(
        loading: () => const SingleChildScrollView(
          padding: EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: LoadingSkeleton(sectionTitle: 'Medication', tileCount: 2),
          ),
        ),
        error: (_, __) => _NotFound(onBack: () => context.go(AppRoutes.meds)),
        data: (medication) {
          if (medication == null) {
            return _NotFound(onBack: () => context.go(AppRoutes.meds));
          }
          return _MedDetailBody(
            medication: medication,
            dosesAsync: dosesAsync,
            onEdit: () async {
              final saved = await MedicationFormSheet.show(
                context,
                editingMedId: medication.id,
                initialName: medication.name,
                initialKind: medication.kind,
              );
              if (saved == true) {
                ref.invalidate(medicationByIdProvider(medId));
                ref.invalidate(medicationDosesProvider(medId));
                ref.invalidate(medsDataProvider);
              }
            },
            onArchive: () async {
              try {
                await ref
                    .read(medsRepositoryProvider)
                    .updateMedicationActive(medId, active: false);
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('${medication.name} archived')),
                );
                ref.invalidate(medsDataProvider);
                context.go(AppRoutes.meds);
              } catch (_) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Could not archive')),
                );
              }
            },
            onRestore: () async {
              try {
                await ref
                    .read(medsRepositoryProvider)
                    .updateMedicationActive(medId, active: true);
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('${medication.name} restored')),
                );
                ref.invalidate(medicationByIdProvider(medId));
                ref.invalidate(medsDataProvider);
              } catch (_) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Could not restore')),
                );
              }
            },
          );
        },
      ),
    );
  }
}

class _NotFound extends StatelessWidget {
  const _NotFound({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return ContentColumn(
      child: Padding(
        padding: const EdgeInsets.only(top: 48),
        child: Column(
          children: [
            Text(
              'Medication not found.',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            TextButton(onPressed: onBack, child: const Text('Back to meds')),
          ],
        ),
      ),
    );
  }
}

class _MedDetailBody extends StatelessWidget {
  const _MedDetailBody({
    required this.medication,
    required this.dosesAsync,
    required this.onEdit,
    required this.onArchive,
    required this.onRestore,
  });

  final Medication medication;
  final AsyncValue<List<MedicationDose>> dosesAsync;
  final VoidCallback onEdit;
  final VoidCallback onArchive;
  final VoidCallback onRestore;

  @override
  Widget build(BuildContext context) {
    final p = MedsPalette.dark();
    final schedule = medication.isRescueMed
        ? 'Rescue medication, taken as needed.'
        : medication.timesOfDay.isEmpty
            ? 'No times set.'
            : medication.timesOfDay.map(formatTimeOfDay).join(', ');

    return SingleChildScrollView(
      padding: const EdgeInsets.only(top: 8, bottom: 120),
      child: ContentColumn(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                TextButton.icon(
                  onPressed: () => context.go(AppRoutes.meds),
                  style: TextButton.styleFrom(minimumSize: const Size(44, 44)),
                  icon: Icon(Icons.arrow_back, size: 18, color: p.textTertiary),
                  label: Text(
                    'Back to medications',
                    style: medsSans(fontSize: 14, color: p.textTertiary),
                  ),
                ),
                const Spacer(),
                PopupMenuButton<String>(
                  icon: Icon(Icons.more_horiz, color: p.textSecondary),
                  onSelected: (value) {
                    switch (value) {
                      case 'edit':
                        onEdit();
                      case 'archive':
                        onArchive();
                      case 'restore':
                        onRestore();
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(value: 'edit', child: Text('Edit')),
                    if (medication.active)
                      const PopupMenuItem(
                        value: 'archive',
                        child: Text('Archive'),
                      )
                    else
                      const PopupMenuItem(
                        value: 'restore',
                        child: Text('Restore'),
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            const MedsSectionEyebrow('Medication'),
            const SizedBox(height: 8),
            Text(
              medication.name,
              style: medsSerif(fontSize: 36, color: p.textPrimary),
            ),
            if (!medication.active) ...[
              const SizedBox(height: 8),
              Text(
                'Archived',
                style: medsSans(fontSize: 12, color: p.textTertiary),
              ),
            ],
            const SizedBox(height: 24),
            GlassSurface(
              borderRadius: BorderRadius.circular(20),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _DetailLine(label: 'Schedule', value: schedule),
                  if (medication.strength != null) ...[
                    const SizedBox(height: 12),
                    _DetailLine(
                      label: 'Strength',
                      value: medication.strength!,
                    ),
                  ],
                  if (medication.pillsRemaining != null) ...[
                    const SizedBox(height: 12),
                    _DetailLine(
                      label: 'Pills remaining',
                      value: '${medication.pillsRemaining!.round()}',
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
            const MedsSectionEyebrow('Recent doses'),
            const SizedBox(height: 12),
            dosesAsync.when(
              loading: () => const LoadingSkeleton(tileCount: 3),
              error: (_, __) => Text(
                'Could not load doses.',
                style: medsSans(fontSize: 15, color: p.textSecondary),
              ),
              data: (doses) {
                if (doses.isEmpty) {
                  return Text(
                    'No doses logged yet.',
                    style: medsSans(fontSize: 15, color: p.textSecondary),
                  );
                }
                return MedsGroupedListShell(
                  children: [
                    for (var i = 0; i < doses.length; i++) ...[
                      if (i > 0) medsListDivider(p),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                        child: Row(
                          children: [
                            Text(
                              DateFormat.yMMMd()
                                  .add_jm()
                                  .format(doses[i].scheduledAt.toLocal()),
                              style: medsSans(
                                fontSize: 12,
                                color: p.textTertiary,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              doses[i].status,
                              style: medsSans(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: p.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                );
              },
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => context.push(AppRoutes.medsHistory),
              child: const Text('View full dose history'),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailLine extends StatelessWidget {
  const _DetailLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final p = MedsPalette.dark();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MedsSectionEyebrow(label, palette: p),
        const SizedBox(height: 4),
        Text(
          value,
          style: medsSans(fontSize: 17, color: p.textPrimary),
        ),
      ],
    );
  }
}
