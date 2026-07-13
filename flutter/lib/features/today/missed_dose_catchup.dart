import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/providers/core_providers.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../meds/meds_repository.dart';
import '../meds/models/dose.dart';
import 'today_meds_section.dart';

const _actedKey = 'purple-dose-catchup-acted';
const _allSentinel = '__all__';
const _doseTtl = Duration(hours: 48);
const _allTtl = Duration(hours: 12);

/// One late pending dose surfaced on Today for catch-up logging.
class MissedDoseCatchupItem {
  const MissedDoseCatchupItem({
    required this.dose,
    required this.extraCount,
  });

  final MedicationDose dose;
  final int extraCount;

  String get medName =>
      dose.medication?.name.trim().isNotEmpty == true
          ? dose.medication!.name.trim()
          : 'medication';
}

/// Preview / web copy: "Missed 10:00am Crestor dose yesterday".
String missedDoseCatchupCopy({
  required DateTime scheduledAt,
  required String medName,
  DateTime? now,
}) {
  final clock = now ?? DateTime.now();
  final local = scheduledAt.toLocal();
  final when = DateFormat('h:mma').format(local).toLowerCase();
  final dayLabel = _dayLabel(local, clock);
  return 'Missed $when $medName dose $dayLabel';
}

String _dayLabel(DateTime scheduledLocal, DateTime now) {
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(
    scheduledLocal.year,
    scheduledLocal.month,
    scheduledLocal.day,
  );
  final diff = today.difference(day).inDays;
  if (diff == 0) return 'earlier today';
  if (diff == 1) return 'yesterday';
  return DateFormat('MMM d').format(scheduledLocal);
}

/// Local dismiss / acted TTL map (mirrors web localStorage key).
class DoseCatchupActedStore {
  DoseCatchupActedStore();

  Future<Map<String, int>> read() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_actedKey);
    if (raw == null || raw.isEmpty) return {};
    try {
      final parsed = jsonDecode(raw);
      if (parsed is! Map) return {};
      final now = DateTime.now().millisecondsSinceEpoch;
      final pruned = <String, int>{};
      for (final entry in parsed.entries) {
        final key = entry.key?.toString();
        final value = entry.value;
        if (key == null || key.isEmpty) continue;
        final exp = value is int
            ? value
            : value is num
                ? value.toInt()
                : int.tryParse(value.toString());
        if (exp != null && exp > now) pruned[key] = exp;
      }
      return pruned;
    } catch (_) {
      return {};
    }
  }

  Future<void> write(Map<String, int> map) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_actedKey, jsonEncode(map));
  }

  Future<void> remember(String doseId, Duration ttl) async {
    final map = await read();
    map[doseId] = DateTime.now().add(ttl).millisecondsSinceEpoch;
    await write(map);
  }

  Future<bool> isAllDismissed() async {
    final map = await read();
    final exp = map[_allSentinel];
    return exp != null && exp > DateTime.now().millisecondsSinceEpoch;
  }

  Future<void> dismissAll() => remember(_allSentinel, _allTtl);

  Future<void> rememberDose(String doseId) async {
    final map = await read();
    final now = DateTime.now();
    map[doseId] = now.add(_doseTtl).millisecondsSinceEpoch;
    map[_allSentinel] = now.add(_allTtl).millisecondsSinceEpoch;
    await write(map);
  }
}

final doseCatchupActedStoreProvider = Provider<DoseCatchupActedStore>((ref) {
  return DoseCatchupActedStore();
});

/// Latest silent pending dose for Today catch-up, or null when none / dismissed.
final missedDoseCatchupProvider =
    FutureProvider.autoDispose<MissedDoseCatchupItem?>((ref) async {
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return null;

  final store = ref.watch(doseCatchupActedStoreProvider);
  if (await store.isAllDismissed()) return null;

  final acted = await store.read();
  final actedIds = acted.keys.where((k) => k != _allSentinel).toSet();
  final silent = await ref
      .watch(medsRepositoryProvider)
      .loadMissedDoseCatchup(actedDoseIds: actedIds);
  if (silent.isEmpty) return null;

  return MissedDoseCatchupItem(
    dose: silent.first,
    extraCount: silent.length - 1,
  );
});

/// Slim Merged-preview catch-up row with Log dropdown.
class MissedDoseCatchupBanner extends ConsumerWidget {
  const MissedDoseCatchupBanner({
    super.key,
    this.onExpandMeds,
  });

  /// Opens the Today Meds expand panel (preview "Review in Meds").
  final VoidCallback? onExpandMeds;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(missedDoseCatchupProvider);
    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (item) {
        if (item == null) return const SizedBox.shrink();
        return _MissedDoseCatchupSlim(
          item: item,
          onExpandMeds: onExpandMeds,
        );
      },
    );
  }
}

class _MissedDoseCatchupSlim extends ConsumerStatefulWidget {
  const _MissedDoseCatchupSlim({
    required this.item,
    this.onExpandMeds,
  });

  final MissedDoseCatchupItem item;
  final VoidCallback? onExpandMeds;

  @override
  ConsumerState<_MissedDoseCatchupSlim> createState() =>
      _MissedDoseCatchupSlimState();
}

class _MissedDoseCatchupSlimState
    extends ConsumerState<_MissedDoseCatchupSlim> {
  bool _busy = false;

  Future<void> _act(String status) async {
    if (_busy) return;
    setState(() => _busy = true);
    final doseId = widget.item.dose.id;
    final store = ref.read(doseCatchupActedStoreProvider);
    await store.rememberDose(doseId);
    try {
      final repo = ref.read(medsRepositoryProvider);
      if (status == 'taken') {
        await repo.markDoseTaken(doseId);
      } else {
        await repo.markDoseSkipped(doseId);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('That did not save. Try again from Meds.'),
          ),
        );
      }
    } finally {
      ref.invalidate(missedDoseCatchupProvider);
      ref.invalidate(medsForDayProvider);
      ref.invalidate(medsDataProvider);
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _dismiss() async {
    await ref.read(doseCatchupActedStoreProvider).dismissAll();
    ref.invalidate(missedDoseCatchupProvider);
  }

  void _reviewInMeds() {
    final expand = widget.onExpandMeds;
    if (expand != null) {
      expand();
      return;
    }
    context.go(AppRoutes.meds);
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);
    final soft = parseTokenColor(colors.purpleSoft);
    final bg = parseTokenColor(colors.backgroundSecondary);
    final border = parseTokenColor(colors.divider);
    final text = parseTokenColor(colors.textPrimary);
    final muted = parseTokenColor(colors.textTertiary);

    final copy = missedDoseCatchupCopy(
      scheduledAt: widget.item.dose.scheduledAt,
      medName: widget.item.medName,
    );

    return Container(
      margin: EdgeInsets.only(bottom: tokens.spacing.md),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: Color.alphaBlend(soft.withValues(alpha: 0.08), bg),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: Color.alphaBlend(purple.withValues(alpha: 0.15), border),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: Color.alphaBlend(soft.withValues(alpha: 0.55), bg),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.medication_outlined, size: 12, color: purple),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  copy,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.3,
                    color: text.withValues(alpha: 0.92),
                  ),
                ),
                if (widget.item.extraCount > 0)
                  Text(
                    widget.item.extraCount == 1
                        ? 'And 1 more from the past day.'
                        : 'And ${widget.item.extraCount} more from the past day.',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: muted),
                  ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            enabled: !_busy,
            tooltip: 'Log late dose',
            offset: const Offset(0, 28),
            color: bg,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: border),
            ),
            onSelected: (value) {
              switch (value) {
                case 'taken':
                  unawaited(_act('taken'));
                  break;
                case 'skipped':
                  unawaited(_act('skipped'));
                  break;
                case 'review':
                  _reviewInMeds();
                  break;
                case 'dismiss':
                  unawaited(_dismiss());
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'taken', child: Text('I took it')),
              const PopupMenuItem(value: 'skipped', child: Text('I missed it')),
              const PopupMenuItem(
                value: 'review',
                child: Text('Review in Meds'),
              ),
              PopupMenuItem(
                value: 'dismiss',
                child: Text(
                  'Not now',
                  style: TextStyle(fontSize: 12, color: muted),
                ),
              ),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Log',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: purple,
                    ),
                  ),
                  Icon(Icons.arrow_drop_down, size: 18, color: purple),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
