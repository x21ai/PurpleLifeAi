import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../shared/glass_helpers.dart';
import 'meds_repository.dart';

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

  static const _kindOptions = [
    ('medication', 'Medication'),
    ('supplement', 'Supplement'),
    ('vitamin', 'Vitamin'),
    ('herbal', 'Herbal'),
    ('rescue', 'Rescue'),
  ];

  bool get _isRescue => _kind == 'rescue';

  bool get _canSave =>
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
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: DraggableScrollableSheet(
        initialChildSize: 0.88,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) {
          return Container(
            decoration: BoxDecoration(
              color: const Color(0xFF120A18),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
            ),
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
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(
                                fontFamily: PurpleType.serif,
                                color: Colors.white.withValues(alpha: 0.95),
                              ),
                        ),
                      ),
                      FilledButton(
                        onPressed: _canSave && !_saving ? _save : null,
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(0, 40),
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
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.95),
                            ),
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
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.55),
                                  ),
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
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.35)),
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.06),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
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
      child: Text(
        text.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              letterSpacing: 1.2,
              color: Colors.white.withValues(alpha: 0.45),
            ),
      ),
    );
  }
}
