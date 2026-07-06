import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers/core_providers.dart';
import '../../design/tokens.dart';
import '../../design/glass_surface.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart' hide GlassSurface;
import '../shared/merged_style.dart';
import 'seizures_style.dart';

const _seizureTypes = [
  ('focal_aware', 'Focal aware'),
  ('focal_impaired_awareness', 'Focal impaired awareness'),
  ('focal_to_bilateral_tonic_clonic', 'Focal to bilateral tonic-clonic'),
  ('generalized_tonic_clonic', 'Generalized tonic-clonic'),
  ('absence', 'Absence'),
  ('myoclonic', 'Myoclonic'),
  ('atonic', 'Atonic'),
  ('unknown', 'Unknown'),
];

/// Seizure logging mirroring web `/seizures/new` (quick log + detailed form).
class LogSeizureScreen extends ConsumerStatefulWidget {
  const LogSeizureScreen({super.key});

  @override
  ConsumerState<LogSeizureScreen> createState() => _LogSeizureScreenState();
}

class _LogSeizureScreenState extends ConsumerState<LogSeizureScreen> {
  String _type = '';
  DateTime _startedAt = DateTime.now();
  bool _witnessed = false;
  final _witnessName = TextEditingController();
  int _durationSeconds = 0;
  double _severity = 5;
  bool _injury = false;
  final _injuryDescription = TextEditingController();
  bool _rescueUsed = false;
  final _rescueName = TextEditingController();
  final _notes = TextEditingController();
  bool _quickSaving = false;
  bool _saving = false;

  SupabaseClient get _client => ref.read(supabaseClientProvider);

  @override
  void dispose() {
    _witnessName.dispose();
    _injuryDescription.dispose();
    _rescueName.dispose();
    _notes.dispose();
    super.dispose();
  }

  String? get _userId => _client.auth.currentSession?.user.id;

  Future<void> _pickDateTime() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startedAt,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_startedAt),
    );
    if (time == null || !mounted) return;

    setState(() {
      _startedAt = DateTime(
        picked.year,
        picked.month,
        picked.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _quickLog() async {
    final userId = _userId;
    if (userId == null || _quickSaving) return;
    setState(() => _quickSaving = true);
    try {
      await _client.from('seizure_events').insert({
        'user_id': userId,
        'started_at': _startedAt.toUtc().toIso8601String(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Logged. You can add details anytime.')),
        );
        context.go(AppRoutes.today);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not log seizure. Try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _quickSaving = false);
    }
  }

  Future<void> _saveDetailed() async {
    final userId = _userId;
    if (userId == null || _saving) return;
    setState(() => _saving = true);
    try {
      await _client.from('seizure_events').insert({
        'user_id': userId,
        'started_at': _startedAt.toUtc().toIso8601String(),
        'type': _type.isEmpty ? null : _type,
        'witnessed': _witnessed,
        'witness_name': _witnessed && _witnessName.text.trim().isNotEmpty
            ? _witnessName.text.trim()
            : null,
        'duration_seconds': _durationSeconds > 0 ? _durationSeconds : null,
        'severity': _severity.round(),
        'injury': _injury,
        'injury_description': _injury && _injuryDescription.text.trim().isNotEmpty
            ? _injuryDescription.text.trim()
            : null,
        'rescue_med_given': _rescueUsed,
        'rescue_med_name': _rescueUsed && _rescueName.text.trim().isNotEmpty
            ? _rescueName.text.trim()
            : null,
        'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Seizure logged')),
        );
        context.go(AppRoutes.today);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not save. Try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return CanvasBackground(
      child: SingleChildScrollView(
        padding: EdgeInsets.only(
          top: tokens.spacing.x2,
          bottom: 120,
        ),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MergedBackLink(
                label: 'Today',
                onPressed: () => context.go(AppRoutes.today),
              ),
              const SizedBox(height: 32),
              const SeizurePageHeader(),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _quickSaving ? null : _quickLog,
                style: FilledButton.styleFrom(
                  minimumSize: const Size(double.infinity, 44),
                ),
                child: _quickSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Quick log now'),
              ),
              const SizedBox(height: 24),
              GlassSurface(
                borderRadius: BorderRadius.circular(24),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Details',
                      style: seizureCardTitle(),
                    ),
                    const SizedBox(height: 16),
                    Text('WHEN', style: seizureSectionLabel()),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: _pickDateTime,
                      child: Text(
                        DateFormat('EEE, MMM d · h:mm a').format(_startedAt),
                      ),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      initialValue: _type.isEmpty ? null : _type,
                      decoration: const InputDecoration(labelText: 'Type'),
                      items: _seizureTypes
                          .map(
                            (t) => DropdownMenuItem(
                              value: t.$1,
                              child: Text(t.$2),
                            ),
                          )
                          .toList(),
                      onChanged: (value) =>
                          setState(() => _type = value ?? ''),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Witnessed'),
                      value: _witnessed,
                      onChanged: (v) => setState(() => _witnessed = v),
                    ),
                    if (_witnessed)
                      TextField(
                        controller: _witnessName,
                        decoration: const InputDecoration(
                          labelText: 'Witness name',
                        ),
                      ),
                    const SizedBox(height: 8),
                    Text('Duration (seconds): $_durationSeconds'),
                    Slider(
                      value: _durationSeconds.toDouble().clamp(0, 600),
                      max: 600,
                      divisions: 60,
                      onChanged: (v) =>
                          setState(() => _durationSeconds = v.round()),
                    ),
                    Text('Severity: ${_severity.round()}'),
                    Slider(
                      value: _severity,
                      min: 1,
                      max: 10,
                      divisions: 9,
                      onChanged: (v) => setState(() => _severity = v),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Injury'),
                      value: _injury,
                      onChanged: (v) => setState(() => _injury = v),
                    ),
                    if (_injury)
                      TextField(
                        controller: _injuryDescription,
                        decoration: const InputDecoration(
                          labelText: 'Injury description',
                        ),
                      ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Rescue medication used'),
                      value: _rescueUsed,
                      onChanged: (v) => setState(() => _rescueUsed = v),
                    ),
                    if (_rescueUsed)
                      TextField(
                        controller: _rescueName,
                        decoration: const InputDecoration(
                          labelText: 'Medication name',
                        ),
                      ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _notes,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Notes',
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Photo and video attachments ship on iOS and Android.',
                      style: seizureMuted(),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _saving ? null : _saveDetailed,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(double.infinity, 44),
                      ),
                      child: _saving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save with details'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
