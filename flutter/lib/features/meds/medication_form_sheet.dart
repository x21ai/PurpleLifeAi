import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../design/glass_surface.dart';
import '../../design/tokens.dart';
import '../shared/glass_helpers.dart' show ContentColumn;
import 'meds_repository.dart';
import 'meds_style.dart';
import 'models/medication.dart';

/// Bottom sheet to add a medication (name, kind, dosage, schedule).
class MedicationFormSheet extends ConsumerStatefulWidget {
  const MedicationFormSheet({
    super.key,
    this.editingMedId,
    this.initialName,
    this.initialKind = 'medication',
  });

  final String? editingMedId;
  final String? initialName;
  final String initialKind;

  static Future<bool?> show(
    BuildContext context, {
    String? editingMedId,
    String? initialName,
    String initialKind = 'medication',
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => MedicationFormSheet(
        editingMedId: editingMedId,
        initialName: initialName,
        initialKind: initialKind,
      ),
    );
  }

  @override
  ConsumerState<MedicationFormSheet> createState() =>
      _MedicationFormSheetState();
}

class _MedicationFormSheetState extends ConsumerState<MedicationFormSheet> {
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  final _unitController = TextEditingController(text: 'mg');

  final List<TextEditingController> _timeControllers = [];

  String _kind = 'medication';
  bool _saving = false;
  bool _loading = false;

  /// Full existing medication row for edits. Retained so save can pass through
  /// any field the sheet has no UI control for (prescriber, pills_remaining,
  /// refill threshold, with-food, start/end dates, alarm fields) instead of
  /// letting them be nulled. Null when adding a new medication.
  Medication? _existing;

  static const _kindOptions = [
    ('medication', 'Medication'),
    ('supplement', 'Supplement'),
    ('vitamin', 'Vitamin'),
    ('herbal', 'Herbal'),
    ('rescue', 'Rescue'),
  ];

  bool get _isRescue => _kind == 'rescue';

  bool get _canSave =>
      !_loading &&
      // For edits, never allow saving until the existing row hydrated —
      // saving over defaults would wipe the medication's real values.
      (widget.editingMedId == null || _existing != null) &&
      _nameController.text.trim().isNotEmpty &&
      (_isRescue || _amountController.text.trim().isNotEmpty);

  @override
  void initState() {
    super.initState();
    _kind = widget.initialKind;
    if (widget.initialName != null) {
      _nameController.text = widget.initialName!;
    }
    _timeControllers.add(TextEditingController(text: '08:00'));
    if (widget.editingMedId != null) {
      _hydrateFromExisting();
    }
  }

  /// Loads the full medication row for an edit and pre-fills every field the
  /// sheet can edit (name, kind, amount, unit, times). Without this, unedited
  /// fields would submit blank and wipe existing DB values. Fields the sheet
  /// has no UI for are preserved via [_existing] on save.
  Future<void> _hydrateFromExisting() async {
    setState(() => _loading = true);
    try {
      final med = await ref
          .read(medsRepositoryProvider)
          .loadMedicationById(widget.editingMedId!);
      if (!mounted) return;
      if (med == null) {
        // Row missing (or cache miss offline): saving over blank defaults
        // would wipe the medication's real values, so bail out instead.
        _abortEditSheet();
        return;
      }
      setState(() {
        _existing = med;
        _nameController.text = med.name;
        _kind = med.kind;
        if (med.dosageAmount != null) {
          _amountController.text = med.dosageAmount.toString();
        }
        if (med.dosageUnit != null && med.dosageUnit!.isNotEmpty) {
          _unitController.text = med.dosageUnit!;
        }
        final times = med.timesOfDay;
        if (times.isNotEmpty) {
          for (final controller in _timeControllers) {
            controller.dispose();
          }
          _timeControllers
            ..clear()
            ..addAll(times.map((t) => TextEditingController(text: t)));
        }
      });
    } catch (_) {
      // Hydration failed: without the existing row, save would clobber real
      // values with defaults (the exact bug Wave-1 fixed). Close instead.
      if (mounted) _abortEditSheet();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// Closes the edit sheet when the existing medication could not be loaded,
  /// so a save can never overwrite real values with blank defaults.
  void _abortEditSheet() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Couldn't load this medication. Try again in a moment."),
      ),
    );
    Navigator.of(context).pop(false);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    _unitController.dispose();
    for (final controller in _timeControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  List<String> get _times =>
      _timeControllers.map((c) => c.text.trim()).toList();

  Future<void> _save() async {
    if (!_canSave || _saving) return;
    setState(() => _saving = true);
    try {
      final repo = ref.read(medsRepositoryProvider);
      if (widget.editingMedId != null) {
        await repo.updateMedication(
          widget.editingMedId!,
          name: _nameController.text.trim(),
          kind: _kind,
          dosageAmount: _isRescue ? null : _amountController.text.trim(),
          dosageUnit: _unitController.text.trim(),
          timesOfDay: _times,
          existing: _existing,
        );
      } else {
        await repo.createMedication(
          name: _nameController.text.trim(),
          kind: _kind,
          dosageAmount: _isRescue ? null : _amountController.text.trim(),
          dosageUnit: _unitController.text.trim(),
          timesOfDay: _times,
          isRescue: _isRescue,
        );
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save medication')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = MedsPalette.dark();
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: DraggableScrollableSheet(
        initialChildSize: 0.88,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) {
          return GlassSurface(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            padding: EdgeInsets.zero,
            variant: GlassMaterialVariant.thick,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          widget.editingMedId == null
                              ? 'Add medication'
                              : 'Edit medication',
                          style: medsSerif(fontSize: 22, color: p.textPrimary),
                        ),
                      ),
                      FilledButton(
                        onPressed: _canSave && !_saving ? _save : null,
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(0, 44),
                          shape: const StadiumBorder(),
                        ),
                        child: _saving
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Save'),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    controller: scrollController,
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                    child: ContentColumn(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const _FieldLabel('Name'),
                          TextField(
                            controller: _nameController,
                            onChanged: (_) => setState(() {}),
                            style: medsSans(fontSize: 16, color: p.textPrimary),
                            decoration: _inputDecoration('Medication name'),
                          ),
                          const SizedBox(height: 20),
                          const _FieldLabel('Type'),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              for (final (value, label) in _kindOptions)
                                ChoiceChip(
                                  label: Text(label),
                                  selected: _kind == value,
                                  onSelected: (_) =>
                                      setState(() => _kind = value),
                                ),
                            ],
                          ),
                          if (!_isRescue) ...[
                            const SizedBox(height: 20),
                            const _FieldLabel('Strength'),
                            Row(
                              children: [
                                Expanded(
                                  flex: 2,
                                  child: TextField(
                                    controller: _amountController,
                                    keyboardType:
                                        const TextInputType.numberWithOptions(
                                      decimal: true,
                                    ),
                                    onChanged: (_) => setState(() {}),
                                    style: TextStyle(
                                      color:
                                          Colors.white.withValues(alpha: 0.95),
                                    ),
                                    decoration: _inputDecoration('Amount'),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextField(
                                    controller: _unitController,
                                    onChanged: (_) => setState(() {}),
                                    style: TextStyle(
                                      color:
                                          Colors.white.withValues(alpha: 0.95),
                                    ),
                                    decoration: _inputDecoration('Unit'),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            const _FieldLabel('Times per day'),
                            for (var i = 0; i < _timeControllers.length; i++) ...[
                              Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _timeControllers[i],
                                      onChanged: (_) => setState(() {}),
                                      style: TextStyle(
                                        color: Colors.white
                                            .withValues(alpha: 0.95),
                                      ),
                                      decoration:
                                          _inputDecoration('HH:MM (24h)'),
                                    ),
                                  ),
                                  if (_timeControllers.length > 1)
                                    IconButton(
                                      onPressed: () => setState(() {
                                        _timeControllers[i].dispose();
                                        _timeControllers.removeAt(i);
                                      }),
                                      icon: const Icon(Icons.remove_circle_outline),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 8),
                            ],
                            TextButton.icon(
                              onPressed: () => setState(
                                () => _timeControllers.add(
                                  TextEditingController(text: '12:00'),
                                ),
                              ),
                              icon: const Icon(Icons.add, size: 16),
                              label: const Text('Add time'),
                            ),
                          ] else ...[
                            const SizedBox(height: 12),
                            Text(
                              'Rescue medications are taken as needed, with no daily schedule.',
                              style: medsSans(fontSize: 13, color: p.textTertiary),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    final p = MedsPalette.dark();
    return InputDecoration(
      hintText: hint,
      hintStyle: medsSans(fontSize: 14, color: p.textTertiary),
      filled: true,
      fillColor: p.surfaceSecondary,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: p.divider),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: p.divider),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: MedsSectionEyebrow(text),
    );
  }
}
