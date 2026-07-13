import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../design/glass_surface.dart';
import '../../design/tokens.dart';
import '../shared/glass_helpers.dart' show ContentColumn;
import 'meds_repository.dart';
import 'meds_style.dart';
import 'models/medication.dart';

/// Bottom sheet to update `medications.pills_remaining` after a refill.
///
/// Mirrors web restock via the medication form's pills field: sets the
/// remaining count directly (DB trigger still decrements on Taken).
class MedRefillSheet extends ConsumerStatefulWidget {
  const MedRefillSheet({super.key, required this.medication});

  final Medication medication;

  /// Returns `true` when the user saved a new remaining count.
  static Future<bool?> show(BuildContext context, Medication medication) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => MedRefillSheet(medication: medication),
    );
  }

  @override
  ConsumerState<MedRefillSheet> createState() => _MedRefillSheetState();
}

class _MedRefillSheetState extends ConsumerState<MedRefillSheet> {
  late final TextEditingController _countController;
  bool _saving = false;

  static const _presets = [30, 60, 90];

  Medication get _med => widget.medication;

  @override
  void initState() {
    super.initState();
    final current = _med.pillsRemaining;
    _countController = TextEditingController(
      text: current == null || current <= 0 ? '' : current.round().toString(),
    );
  }

  @override
  void dispose() {
    _countController.dispose();
    super.dispose();
  }

  bool get _canSave {
    final parsed = int.tryParse(_countController.text.trim());
    return parsed != null && parsed >= 0;
  }

  Future<void> _save() async {
    if (!_canSave || _saving) return;
    final parsed = int.parse(_countController.text.trim());
    setState(() => _saving = true);
    try {
      await ref.read(medsRepositoryProvider).updatePillsRemaining(
            _med.id,
            pillsRemaining: parsed,
          );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not update pill count')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = MedsPalette.dark();
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final current = _med.pillsRemaining;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: GlassSurface(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        variant: GlassMaterialVariant.thick,
        child: ContentColumn(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Update stock',
                style: medsSerif(fontSize: 22, color: p.textPrimary),
              ),
              const SizedBox(height: 4),
              Text(
                _med.name,
                style: medsSans(fontSize: 15, color: p.textSecondary),
              ),
              if (current != null) ...[
                const SizedBox(height: 8),
                Text(
                  current <= 0
                      ? 'Currently 0 pills left'
                      : 'Currently ${current.round()} pills left',
                  style: medsSans(
                    fontSize: 13,
                    color: current <= 0
                        ? parseTokenColor(
                            PurpleTokens.loaded.colorsFor('dark').destructive,
                          )
                        : p.textTertiary,
                  ),
                ),
              ],
              const SizedBox(height: 20),
              Text(
                'Pills remaining after refill',
                style: medsSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.6,
                  color: p.textTertiary,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _countController,
                autofocus: true,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                onChanged: (_) => setState(() {}),
                style: medsSans(fontSize: 18, color: p.textPrimary),
                decoration: InputDecoration(
                  hintText: '30',
                  hintStyle: medsSans(fontSize: 18, color: p.textTertiary),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.06),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: p.divider),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: p.divider),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: parseTokenColor(
                        PurpleTokens.loaded.colorsFor('dark').purplePrimary,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final n in _presets)
                    ActionChip(
                      label: Text('$n'),
                      onPressed: () => setState(() {
                        _countController.text = '$n';
                      }),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _canSave && !_saving ? _save : null,
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
                      : const Text('I refilled'),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: _saving ? null : () => Navigator.of(context).pop(false),
                  style: TextButton.styleFrom(minimumSize: const Size(0, 44)),
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
