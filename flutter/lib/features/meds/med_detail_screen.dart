import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'dose_list.dart';
import 'medication_form_sheet.dart';
import 'meds_repository.dart';
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
                  icon: Icon(
                    Icons.arrow_back,
                    size: 18,
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                  label: Text(
                    'Back to medications',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
                  ),
                ),
                const Spacer(),
                PopupMenuButton<String>(
                  icon: Icon(
                    Icons.more_horiz,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
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
            Text(
              'MEDICATION',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.2,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              medication.name,
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontFamily: PurpleType.serif,
                    height: 1.02,
                    color: Colors.white.withValues(alpha: 0.95),
                  ),
            ),
            if (!medication.active) ...[
              const SizedBox(height: 8),
              Text(
                'Archived',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
              ),
            ],
            const SizedBox(height: 24),
            GlassSurface(
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
            Text(
              'RECENT DOSES',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.2,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
            ),
            const SizedBox(height: 12),
            dosesAsync.when(
              loading: () => const LoadingSkeleton(tileCount: 3),
              error: (_, __) => Text(
                'Could not load doses.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.65),
                    ),
              ),
              data: (doses) {
                if (doses.isEmpty) {
                  return Text(
                    'No doses logged yet.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.65),
                        ),
                  );
                }
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(20),
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    children: [
                      for (var i = 0; i < doses.length; i++) ...[
                        if (i > 0)
                          Divider(
                            height: 1,
                            color: Colors.white.withValues(alpha: 0.08),
                          ),
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
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(
                                      color: Colors.white
                                          .withValues(alpha: 0.55),
                                    ),
                              ),
                              const Spacer(),
                              Text(
                                doses[i].status,
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 1.2,
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.white.withValues(alpha: 0.9),
              ),
        ),
      ],
    );
  }
}
