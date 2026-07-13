import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../design/purple_type.dart';
import 'electrolyte_presets.dart';
import 'hydration_repository.dart';

/// Quick-add chips matching web `QuickAddWater` (250 / 500 / Water / Electrolytes).
class QuickAddWater extends ConsumerStatefulWidget {
  const QuickAddWater({
    super.key,
    this.onLogged,
    this.compact = false,
  });

  /// Called after a successful log (e.g. invalidate Today summary).
  final VoidCallback? onLogged;

  /// Slightly tighter spacing for Today expand panel.
  final bool compact;

  @override
  ConsumerState<QuickAddWater> createState() => _QuickAddWaterState();
}

class _QuickAddWaterState extends ConsumerState<QuickAddWater> {
  bool _logging = false;

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
      final now = DateTime.now();
      ref.invalidate(
        hydrationDayProvider(DateTime(now.year, now.month, now.day)),
      );
      widget.onLogged?.call();
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

  Future<void> _showCustomWaterDialog() async {
    var volume = 250;
    final customController = TextEditingController(text: '250');
    final result = await showDialog<int>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(
                'Add water',
                style: PurpleType.serifStyle(fontSize: 22),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Logged at the current time.'),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: kQuickWaterAmountsMl.map((v) {
                      final selected = volume == v;
                      return ChoiceChip(
                        label: Text('$v ml'),
                        selected: selected,
                        onSelected: (_) => setDialogState(() {
                          volume = v;
                          customController.text = '$v';
                        }),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: customController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(labelText: 'Custom (ml)'),
                    onChanged: (value) {
                      final parsed = int.tryParse(value);
                      if (parsed != null) {
                        setDialogState(() => volume = parsed);
                      }
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: volume > 0 && volume <= 5000
                      ? () => Navigator.pop(dialogContext, volume)
                      : null,
                  child: const Text('Add'),
                ),
              ],
            );
          },
        );
      },
    );
    customController.dispose();
    if (result != null && result > 0) {
      await _log(volumeMl: result, kind: 'water');
    }
  }

  Future<void> _showElectrolyteDialog() async {
    var selected = kElectrolytePresets.first;
    var volume = selected.defaultVolumeMl;
    var sodium = selected.sodiumMg;
    final volumeController =
        TextEditingController(text: '${selected.defaultVolumeMl}');
    final sodiumController =
        TextEditingController(text: '${selected.sodiumMg}');

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(
                'Add electrolytes',
                style: PurpleType.serifStyle(fontSize: 22),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Sodium is auto-filled from the brand. Override if needed.',
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: kElectrolytePresets.map((p) {
                        return ChoiceChip(
                          label: Text(p.brand),
                          selected: selected.brand == p.brand,
                          onSelected: (_) => setDialogState(() {
                            selected = p;
                            volume = p.defaultVolumeMl;
                            sodium = p.sodiumMg;
                            volumeController.text = '${p.defaultVolumeMl}';
                            sodiumController.text = '${p.sodiumMg}';
                          }),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: volumeController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration:
                          const InputDecoration(labelText: 'Volume (ml)'),
                      onChanged: (value) {
                        volume = int.tryParse(value) ?? volume;
                        setDialogState(() {});
                      },
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: sodiumController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration:
                          const InputDecoration(labelText: 'Sodium (mg)'),
                      onChanged: (value) {
                        sodium = int.tryParse(value) ?? sodium;
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: volume > 0 && volume <= 5000
                      ? () => Navigator.pop(dialogContext, true)
                      : null,
                  child: const Text('Add'),
                ),
              ],
            );
          },
        );
      },
    );
    volumeController.dispose();
    sodiumController.dispose();
    if (confirmed == true) {
      await _log(
        volumeMl: volume,
        kind: 'electrolyte',
        brand: selected.brand,
        sodiumMg: sodium,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final gap = widget.compact ? 6.0 : 8.0;
    return Wrap(
      spacing: gap,
      runSpacing: gap,
      children: [
        FilledButton.tonal(
          onPressed: _logging ? null : () => _log(volumeMl: 250, kind: 'water'),
          style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
          child: const Text('250 ml'),
        ),
        FilledButton.tonal(
          onPressed: _logging ? null : () => _log(volumeMl: 500, kind: 'water'),
          style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
          child: const Text('500 ml'),
        ),
        OutlinedButton(
          onPressed: _logging ? null : _showCustomWaterDialog,
          style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44)),
          child: const Text('Water'),
        ),
        OutlinedButton(
          onPressed: _logging ? null : _showElectrolyteDialog,
          style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44)),
          child: const Text('Electrolytes'),
        ),
      ],
    );
  }
}
