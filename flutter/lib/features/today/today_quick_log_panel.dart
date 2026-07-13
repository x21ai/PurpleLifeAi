import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/providers/core_providers.dart';
import '../../shell/routes.dart';
import '../journal/journal_repository.dart';
import '../seizures/seizure_repository.dart';

/// Kind chips in Merged Today Quick log (preview Aura / Seizure / Other).
enum TodayQuickLogKind { aura, seizure, other }

/// Inline Quick log expander body: chips, when picker, notes, Save.
///
/// Writes without leaving Today:
/// - [TodayQuickLogKind.aura] → `aura_events`
/// - [TodayQuickLogKind.seizure] → `seizure_events` (quick log)
/// - [TodayQuickLogKind.other] (or non-seizure profiles) → journal entry
class TodayLogExpandBody extends ConsumerStatefulWidget {
  const TodayLogExpandBody({
    super.key,
    required this.showSeizure,
    required this.selectedDate,
    this.onJournal,
    this.onSeizure,
  });

  final bool showSeizure;
  final DateTime selectedDate;

  /// Optional deep links retained for full forms (not required to save).
  final VoidCallback? onJournal;
  final VoidCallback? onSeizure;

  @override
  ConsumerState<TodayLogExpandBody> createState() => _TodayLogExpandBodyState();
}

class _TodayLogExpandBodyState extends ConsumerState<TodayLogExpandBody> {
  late TodayQuickLogKind _kind;
  late DateTime _when;
  final _notes = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _kind = widget.showSeizure
        ? TodayQuickLogKind.aura
        : TodayQuickLogKind.other;
    _when = _defaultWhen(widget.selectedDate);
  }

  @override
  void didUpdateWidget(covariant TodayLogExpandBody oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!widget.showSeizure && _kind != TodayQuickLogKind.other) {
      _kind = TodayQuickLogKind.other;
    }
    if (!_sameDay(oldWidget.selectedDate, widget.selectedDate)) {
      _when = _defaultWhen(widget.selectedDate);
    }
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  static bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  static DateTime _defaultWhen(DateTime day) {
    final now = DateTime.now();
    if (_sameDay(day, now)) return now;
    return DateTime(day.year, day.month, day.day, now.hour, now.minute);
  }

  bool get _requiresNotes =>
      !widget.showSeizure || _kind == TodayQuickLogKind.other;

  Future<void> _pickWhen() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _when,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
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
    final text = _notes.text.trim();
    if (_requiresNotes && text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add a short note before saving.')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      if (widget.showSeizure && _kind == TodayQuickLogKind.aura) {
        await _logAura(notes: text.isEmpty ? null : text);
      } else if (widget.showSeizure && _kind == TodayQuickLogKind.seizure) {
        await ref.read(seizureRepositoryProvider).quickLog(
              startedAt: _when,
              notes: text.isEmpty ? null : text,
            );
      } else {
        await ref.read(journalRepositoryProvider).saveEntry(
              text: text,
              capturedAt: _when,
            );
      }
      if (!mounted) return;
      _notes.clear();
      setState(() => _when = _defaultWhen(widget.selectedDate));
      final label = switch (_kind) {
        TodayQuickLogKind.aura => 'Aura logged',
        TodayQuickLogKind.seizure => 'Seizure logged',
        TodayQuickLogKind.other => 'Journal entry saved',
      };
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(label)),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save. Try again.')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _logAura({String? notes}) async {
    final client = ref.read(supabaseClientProvider);
    final userId =
        client.auth.currentSession?.user.id ?? client.auth.currentUser?.id;
    if (userId == null) {
      throw StateError('Sign in to log an aura');
    }
    await client.from('aura_events').insert({
      'user_id': userId,
      'occurred_at': _when.toUtc().toIso8601String(),
      'kind': 'deja_vu',
      'notes': notes,
      'led_to_seizure': false,
      'created_by_kind': 'self',
      'created_by_id': userId,
    });
  }

  @override
  Widget build(BuildContext context) {
    final muted = Colors.white.withValues(alpha: 0.65);
    final whenLabel = DateFormat('MMM d · h:mm a').format(_when);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          widget.showSeizure
              ? 'Capture aura or seizure details without leaving Today.'
              : 'Journal symptoms, mood, and notes in one place.',
          style: TextStyle(fontSize: 13, color: muted, height: 1.4),
        ),
        if (widget.showSeizure) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _KindChip(
                label: 'Aura',
                selected: _kind == TodayQuickLogKind.aura,
                onTap: () => setState(() => _kind = TodayQuickLogKind.aura),
              ),
              _KindChip(
                label: 'Seizure',
                selected: _kind == TodayQuickLogKind.seizure,
                onTap: () => setState(() => _kind = TodayQuickLogKind.seizure),
              ),
              _KindChip(
                label: 'Other',
                selected: _kind == TodayQuickLogKind.other,
                onTap: () => setState(() => _kind = TodayQuickLogKind.other),
              ),
            ],
          ),
        ],
        const SizedBox(height: 12),
        Row(
          children: [
            Text(
              'When?',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.45),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                onPressed: _saving ? null : _pickWhen,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white.withValues(alpha: 0.85),
                  side: BorderSide(
                    color: Colors.white.withValues(alpha: 0.18),
                  ),
                  minimumSize: const Size(0, 44),
                ),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(whenLabel),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _notes,
          enabled: !_saving,
          minLines: 2,
          maxLines: 4,
          maxLength: 500,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'What happened?',
            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.35)),
            counterText: '',
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.06),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: Colors.white.withValues(alpha: 0.12),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: Colors.white.withValues(alpha: 0.12),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: Colors.white.withValues(alpha: 0.35),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Save'),
        ),
        if (widget.showSeizure && _kind == TodayQuickLogKind.seizure) ...[
          const SizedBox(height: 4),
          TextButton(
            onPressed: _saving
                ? null
                : (widget.onSeizure ??
                    () => context.go(AppRoutes.seizuresNew)),
            child: const Text('Open full seizure form'),
          ),
        ],
        if (_kind == TodayQuickLogKind.other) ...[
          const SizedBox(height: 4),
          TextButton(
            onPressed: _saving
                ? null
                : (widget.onJournal ??
                    () => context.go(AppRoutes.journalNew)),
            child: const Text('Open journal capture'),
          ),
        ],
      ],
    );
  }
}

class _KindChip extends StatelessWidget {
  const _KindChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      showCheckmark: false,
      selectedColor: const Color(0xFFB084D1).withValues(alpha: 0.28),
      backgroundColor: Colors.white.withValues(alpha: 0.06),
      labelStyle: TextStyle(
        color: Colors.white.withValues(alpha: selected ? 0.95 : 0.7),
        fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
        fontSize: 13,
      ),
      side: BorderSide(
        color: selected
            ? const Color(0xFFB084D1).withValues(alpha: 0.55)
            : Colors.white.withValues(alpha: 0.12),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}
