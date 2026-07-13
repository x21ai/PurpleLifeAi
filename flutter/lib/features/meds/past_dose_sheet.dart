import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../design/glass_surface.dart';
import '../../design/tokens.dart';
import 'meds_repository.dart';
import 'meds_style.dart';
import 'meds_today.dart';
import 'models/dose.dart';
import 'models/medication.dart';

/// Bottom sheet to add or edit a past dose (web med detail `saveDose`).
class PastDoseSheet extends ConsumerStatefulWidget {
  const PastDoseSheet({
    super.key,
    required this.medication,
    this.existing,
  });

  final Medication medication;
  final MedicationDose? existing;

  static Future<bool?> show(
    BuildContext context, {
    required Medication medication,
    MedicationDose? existing,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => PastDoseSheet(
        medication: medication,
        existing: existing,
      ),
    );
  }

  @override
  ConsumerState<PastDoseSheet> createState() => _PastDoseSheetState();
}

class _PastDoseSheetState extends ConsumerState<PastDoseSheet> {
  late DateTime _when;
  late String _status;
  late final TextEditingController _amountController;
  late final TextEditingController _unitController;
  bool _saving = false;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    final med = widget.medication;
    if (existing != null) {
      _when = existing.scheduledAt.toLocal();
      _status = normalizePastDoseStatus(existing.status);
      _amountController = TextEditingController(
        text: existing.amount != null ? '${existing.amount}' : '',
      );
      _unitController = TextEditingController(
        text: existing.unit ?? med.dosageUnit ?? '',
      );
    } else {
      _when = DateTime.now();
      _status = 'taken';
      _amountController = TextEditingController(
        text: med.dosageAmount != null ? '${med.dosageAmount}' : '',
      );
      _unitController = TextEditingController(text: med.dosageUnit ?? '');
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _unitController.dispose();
    super.dispose();
  }

  Future<void> _pickWhen() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _when,
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_when),
    );
    if (time == null || !mounted) return;
    setState(() {
      _when = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _save() async {
    if (_saving) return;
    setState(() => _saving = true);
    final amountText = _amountController.text.trim();
    final unitText = _unitController.text.trim();
    try {
      await ref.read(medsRepositoryProvider).savePastDose(
            doseId: widget.existing?.id,
            medicationId: widget.medication.id,
            scheduledAt: _when,
            status: _status,
            amount: amountText.isEmpty ? null : num.tryParse(amountText),
            unit: unitText.isEmpty ? null : unitText,
          );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("That didn't work. Try again in a moment."),
        ),
      );
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = MedsPalette.dark();
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final whenLabel = DateFormat.yMMMd().add_jm().format(_when);

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: GlassSurface(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        variant: GlassMaterialVariant.thick,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _isEdit ? 'Edit dose' : 'Add a past dose',
              style: medsSerif(fontSize: 22, color: p.textPrimary),
            ),
            const SizedBox(height: 16),
            Text(
              'Date and time',
              style: medsSans(fontSize: 12, color: p.textTertiary),
            ),
            const SizedBox(height: 6),
            OutlinedButton(
              onPressed: _pickWhen,
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(0, 44),
                alignment: Alignment.centerLeft,
                foregroundColor: p.textPrimary,
                side: BorderSide(color: p.divider),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(whenLabel),
            ),
            const SizedBox(height: 16),
            Text(
              'Status',
              style: medsSans(fontSize: 12, color: p.textTertiary),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final status in kPastDoseStatuses)
                  ChoiceChip(
                    label: Text(
                      status,
                      style: medsSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _status == status
                            ? Colors.white
                            : p.textSecondary,
                      ),
                    ),
                    selected: _status == status,
                    onSelected: (_) => setState(() => _status = status),
                    selectedColor: p.purplePrimary,
                    backgroundColor: p.surfaceSecondary,
                    showCheckmark: false,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Amount',
              style: medsSans(fontSize: 12, color: p.textTertiary),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: TextField(
                    controller: _amountController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    style: medsSans(fontSize: 15, color: p.textPrimary),
                    decoration: InputDecoration(
                      hintText: med.dosageAmount?.toString() ?? 'amount',
                      hintStyle: medsSans(fontSize: 15, color: p.textTertiary),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _unitController,
                    style: medsSans(fontSize: 15, color: p.textPrimary),
                    decoration: InputDecoration(
                      hintText: med.dosageUnit ?? 'mg',
                      hintStyle: medsSans(fontSize: 15, color: p.textTertiary),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _saving ? null : _save,
              style: FilledButton.styleFrom(
                minimumSize: const Size(0, 48),
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
    );
  }

  Medication get med => widget.medication;
}
