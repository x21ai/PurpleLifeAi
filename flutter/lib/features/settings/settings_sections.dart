import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:url_launcher/url_launcher.dart';

import '../../core/providers/core_providers.dart';
import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../shared/condition_prompts.dart';
import '../shared/glass_helpers.dart';
import 'data_export_service.dart';
import 'feature_catalog.dart';

/// Below-the-fold Settings sections ported from web
/// `src/routes/_app/settings.tsx` and `src/components/settings/*`.
///
/// Every value shown here is read from the live `profiles` row. Controls that
/// are plain `profiles` column updates (same RLS path the web uses) save for
/// real; features that need Worker server functions (export, deletion,
/// tracker catalog edits) are honest read-only with a "web app for now" note.

/// Condition slug -> label, from `src/lib/condition-catalog.ts`.
const conditionLabels = <String, String>{
  'epilepsy': 'Epilepsy / seizures',
  'migraine': 'Migraine',
  'cluster_headache': 'Cluster headache',
  'parkinsons': "Parkinson's disease",
  'multiple_sclerosis': 'Multiple sclerosis',
  'stroke_recovery': 'Stroke recovery',
  'neuropathy': 'Peripheral neuropathy',
  'autism': 'Autism / ASD',
  'adhd': 'ADHD',
  'dementia': "Alzheimer's & dementia",
  'depression': 'Depression',
  'anxiety': 'Anxiety',
  'bipolar': 'Bipolar disorder',
  'ptsd': 'PTSD',
  'ocd': 'OCD',
  'eating_disorder': 'Eating disorder',
  'hypertension': 'High blood pressure',
  't1_diabetes': 'Type 1 diabetes',
  't2_diabetes': 'Type 2 diabetes',
  'prediabetes': 'Pre-diabetes',
  'high_cholesterol': 'High cholesterol',
  'afib': 'Atrial fibrillation',
  'heart_failure': 'Heart failure',
  'rheumatoid_arthritis': 'Rheumatoid arthritis',
  'lupus': 'Lupus (SLE)',
  'crohns': "Crohn's disease",
  'ulcerative_colitis': 'Ulcerative colitis',
  'psoriasis': 'Psoriasis',
  'hashimotos': "Hashimoto's / hypothyroidism",
  'celiac': 'Celiac disease',
  'asthma': 'Asthma',
  'copd': 'COPD',
  'sleep_apnea': 'Sleep apnea',
  'fibromyalgia': 'Fibromyalgia',
  'chronic_pain': 'Chronic pain',
  'long_covid': 'Long COVID / ME-CFS',
  'pots': 'POTS / dysautonomia',
  'eds': 'Ehlers-Danlos (hypermobility)',
  'ibs': 'IBS',
  'gerd': 'GERD',
  'ckd': 'Chronic kidney disease',
  'cancer': 'Cancer (in treatment / survivorship)',
  'caregiver': 'Caregiving for someone',
  'general': 'General wellness',
};

String conditionLabel(String id) => conditionLabels[id] ?? id;

/// Profile flags for the Settings hub: seizure gating + admin role.
class SettingsProfileFlags {
  const SettingsProfileFlags({
    this.conditions = const [],
    this.isAdmin = false,
  });

  final List<String> conditions;
  final bool isAdmin;

  bool get showSeizure => showsSeizureFeatures(conditions);
}

final settingsProfileFlagsProvider =
    FutureProvider<SettingsProfileFlags>((ref) async {
  await ref.watch(authRepositoryProvider.future);
  final client = Supabase.instance.client;
  final userId = client.auth.currentSession?.user.id;
  if (userId == null) return const SettingsProfileFlags();

  var conditions = const <String>[];
  var isAdmin = false;
  try {
    final row = await client
        .from('profiles')
        .select('conditions')
        .eq('id', userId)
        .maybeSingle();
    final raw = row?['conditions'];
    if (raw is List) conditions = raw.whereType<String>().toList();
  } catch (_) {
    // Fail open: hide seizure rows rather than blocking the hub.
  }
  try {
    final roles = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
    isAdmin = roles.any(
      (r) => r['role'] == 'admin' || r['role'] == 'super_admin',
    );
  } catch (_) {
    isAdmin = false;
  }
  return SettingsProfileFlags(conditions: conditions, isAdmin: isAdmin);
});

/// Honest "lives in the web app" sheet for rows whose feature needs a Worker
/// or route that does not exist in the Flutter app yet. Never a silent no-op.
void showWebOnlySheet(
  BuildContext context, {
  required String title,
  required String message,
}) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: const Color(0xFF14101C),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (sheetContext) {
      return SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: sectionTitleStyle(sheetContext)),
              const SizedBox(height: 8),
              Text(message, style: sectionMutedStyle(sheetContext)),
              const SizedBox(height: 20),
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(sheetContext).maybePop(),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

TextStyle sectionTitleStyle(BuildContext context) {
  return PurpleType.serifStyle(
    fontSize: 20,
    height: 1.2,
    color: Colors.white.withValues(alpha: 0.95),
  );
}

TextStyle sectionRowTitleStyle(BuildContext context) {
  return PurpleType.serifStyle(
    fontSize: 16,
    height: 1.25,
    color: Colors.white.withValues(alpha: 0.92),
  );
}

TextStyle sectionMutedStyle(BuildContext context) {
  return Theme.of(context).textTheme.bodySmall!.copyWith(
        color: Colors.white.withValues(alpha: 0.55),
        height: 1.45,
      );
}

Widget _rowDivider() {
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 16),
    child: Divider(height: 1, color: Colors.white.withValues(alpha: 0.08)),
  );
}

Widget _labelWithIcon(
  BuildContext context,
  IconData icon,
  String label, {
  bool saving = false,
}) {
  return Row(
    children: [
      Icon(icon, size: 16, color: Theme.of(context).colorScheme.primary),
      const SizedBox(width: 8),
      Text(label, style: sectionRowTitleStyle(context)),
      if (saving) ...[
        const SizedBox(width: 8),
        SizedBox(
          width: 12,
          height: 12,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Colors.white.withValues(alpha: 0.5),
          ),
        ),
      ],
    ],
  );
}

/// Preferences section (web `preferences-section.tsx`): focus chips, AI
/// model, Floating Ask, sleep window, snooze, water goal, quiet hours,
/// weekly digest, and the "How Purple thinks" row.
class PreferencesSection extends ConsumerStatefulWidget {
  const PreferencesSection({super.key});

  @override
  ConsumerState<PreferencesSection> createState() => _PreferencesSectionState();
}

class _AiModelOption {
  const _AiModelOption(this.value, this.label, this.hint, this.group);

  final String value;
  final String label;
  final String hint;
  final String group;
}

const _aiModelOptions = <_AiModelOption>[
  _AiModelOption(
      'gemini-flash', 'Gemini Flash', 'Quickest replies. Best default.', 'Fast'),
  _AiModelOption(
      'gpt-5-mini', 'GPT-5 mini', 'OpenAI, fast and balanced.', 'Fast'),
  _AiModelOption('claude-sonnet', 'Claude Sonnet',
      'Warm tone, careful reasoning. Used for actions.', 'Balanced'),
  _AiModelOption(
      'gemini-pro', 'Gemini Pro', 'Slower, more thorough.', 'Balanced'),
  _AiModelOption(
      'gpt-5', 'GPT-5', 'OpenAI flagship. Deep reasoning, slower.', 'Deepest'),
  _AiModelOption('gemini-2.5-pro', 'Gemini 2.5 Pro',
      "Google's deepest. Long context.", 'Deepest'),
];

class _PreferencesSectionState extends ConsumerState<PreferencesSection> {
  bool _loading = true;
  List<String> _conditions = [];
  String _model = 'gemini-flash';
  bool _fab = true;
  String _wakeTime = '07:00';
  String _sleepTime = '23:00';
  int _snoozeMinutes = 10;
  int _waterGoalMl = 2000;
  String? _quietStart;
  String? _quietEnd;
  bool _weeklyDigest = true;

  bool _savingModel = false;
  bool _savingFab = false;
  bool _savingDigest = false;
  bool _savingGoal = false;
  bool _savingConditions = false;
  final _customDraftController = TextEditingController();
  final _waterController = TextEditingController();
  Timer? _waterTimer;

  SupabaseClient get _client => Supabase.instance.client;

  String? get _userId => _client.auth.currentSession?.user.id;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _waterTimer?.cancel();
    _waterController.dispose();
    _customDraftController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final userId = _userId;
    if (userId == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final row = await _client
          .from('profiles')
          .select(
              'ai_model_preference, floating_ask_enabled, wake_time, sleep_time, '
              'snooze_minutes, conditions, conditions_note, daily_water_goal_ml, '
              'quiet_hours_start, quiet_hours_end, weekly_digest_enabled')
          .eq('id', userId)
          .maybeSingle();
      if (!mounted) return;
      setState(() {
        final existing = <String>[];
        final raw = row?['conditions'];
        if (raw is List) existing.addAll(raw.whereType<String>());
        final legacy = (row?['conditions_note'] as String? ?? '')
            .split(RegExp(r'[,;\n]'))
            .map((s) => s.trim())
            .where((s) => s.isNotEmpty);
        final seen = existing.map((c) => c.toLowerCase()).toSet();
        final merged = [...existing];
        for (final item in legacy) {
          if (!seen.contains(item.toLowerCase())) {
            merged.add(item);
            seen.add(item.toLowerCase());
          }
        }
        _conditions = merged;
        if (legacy.isNotEmpty) {
          unawaited(_client.from('profiles').update({
            'conditions': merged,
            'conditions_note': null,
          }).eq('id', userId));
        }
        _model = (row?['ai_model_preference'] as String?) ?? 'gemini-flash';
        _fab = (row?['floating_ask_enabled'] as bool?) ?? true;
        _wakeTime = _clipTime(row?['wake_time'] as String?) ?? '07:00';
        _sleepTime = _clipTime(row?['sleep_time'] as String?) ?? '23:00';
        _snoozeMinutes = (row?['snooze_minutes'] as num?)?.toInt() ?? 10;
        _waterGoalMl = (row?['daily_water_goal_ml'] as num?)?.toInt() ?? 2000;
        _quietStart = _clipTime(row?['quiet_hours_start'] as String?);
        _quietEnd = _clipTime(row?['quiet_hours_end'] as String?);
        _weeklyDigest = (row?['weekly_digest_enabled'] as bool?) ?? true;
        _waterController.text = '$_waterGoalMl';
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  static String? _clipTime(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    return raw.length >= 5 ? raw.substring(0, 5) : raw;
  }

  Future<bool> _update(Map<String, dynamic> patch) async {
    final userId = _userId;
    if (userId == null) return false;
    try {
      await _client.from('profiles').update(patch).eq('id', userId);
      return true;
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Couldn't save preference")),
        );
      }
      return false;
    }
  }

  Future<void> _persistConditions(List<String> next) async {
    setState(() {
      _conditions = next;
      _savingConditions = true;
    });
    final ok = await _update({'conditions': next});
    if (!mounted) return;
    setState(() => _savingConditions = false);
    if (ok) ref.invalidate(settingsProfileFlagsProvider);
  }

  Future<void> _toggleCondition(String id) async {
    final next = _conditions.contains(id)
        ? _conditions.where((c) => c != id).toList()
        : [..._conditions, id];
    await _persistConditions(next);
  }

  Future<void> _addCustomCondition() async {
    final value = _customDraftController.text.trim();
    if (value.isEmpty || value.length > 60) return;
    if (_conditions.any((c) => c.toLowerCase() == value.toLowerCase())) {
      _customDraftController.clear();
      return;
    }
    await _persistConditions([..._conditions, value]);
    _customDraftController.clear();
  }

  Future<void> _pickTime({
    required String? current,
    required Future<void> Function(String value) onPicked,
  }) async {
    final parsed = _parseTimeOfDay(current);
    final picked = await showTimePicker(
      context: context,
      initialTime: parsed ?? const TimeOfDay(hour: 7, minute: 0),
    );
    if (picked == null) return;
    final formatted =
        '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
    await onPicked(formatted);
  }

  static TimeOfDay? _parseTimeOfDay(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    final parts = raw.split(':');
    if (parts.length < 2) return null;
    final h = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    if (h == null || m == null) return null;
    return TimeOfDay(hour: h, minute: m);
  }

  String _displayTime(BuildContext context, String? raw, {String empty = 'Not set'}) {
    final parsed = _parseTimeOfDay(raw);
    if (parsed == null) return empty;
    return parsed.format(context);
  }

  void _scheduleWaterSave(String rawValue) {
    _waterTimer?.cancel();
    _waterTimer = Timer(const Duration(milliseconds: 700), () async {
      final n = int.tryParse(rawValue.trim());
      if (n == null || n < 250 || n > 10000) return;
      setState(() => _savingGoal = true);
      final ok = await _update({'daily_water_goal_ml': n});
      if (!mounted) return;
      setState(() {
        _savingGoal = false;
        if (ok) _waterGoalMl = n;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return GlassSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Preferences', style: sectionTitleStyle(context)),
          const SizedBox(height: 4),
          Text(
            'How Purple talks to you and which mind does the thinking.',
            style: sectionMutedStyle(context),
          ),
          const SizedBox(height: 20),

          // Your focus: same Supabase `profiles.conditions` path as web.
          _labelWithIcon(context, Icons.favorite_outline, 'Your focus',
              saving: _savingConditions),
          const SizedBox(height: 4),
          Text(
            "What you're managing. Shapes prompts and how Purple talks with you.",
            style: sectionMutedStyle(context),
          ),
          const SizedBox(height: 12),
          if (_loading)
            Text('Loading', style: sectionMutedStyle(context))
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final entry in conditionLabels.entries)
                  _ConditionChip(
                    label: entry.value,
                    active: _conditions.contains(entry.key),
                    enabled: !_loading && !_savingConditions,
                    onTap: () => _toggleCondition(entry.key),
                  ),
                for (final c in _conditions.where(
                    (c) => !conditionLabels.containsKey(c)))
                  _ConditionChip(
                    label: c,
                    active: true,
                    enabled: !_loading && !_savingConditions,
                    removable: true,
                    onTap: () => _toggleCondition(c),
                  ),
              ],
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _customDraftController,
                  enabled: !_loading && !_savingConditions,
                  maxLength: 60,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(alpha: 0.92),
                  ),
                  decoration: InputDecoration(
                    counterText: '',
                    hintText: 'Add your own (e.g. Heart health)',
                    hintStyle:
                        TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.04),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                          color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                          color: Colors.white.withValues(alpha: 0.25)),
                    ),
                  ),
                  onSubmitted: (_) => _addCustomCondition(),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: _loading ||
                        _savingConditions ||
                        _customDraftController.text.trim().isEmpty
                    ? null
                    : _addCustomCondition,
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Add'),
              ),
            ],
          ),
          _rowDivider(),

          // AI model.
          _labelWithIcon(context, Icons.auto_awesome_outlined, 'AI model',
              saving: _savingModel),
          const SizedBox(height: 4),
          Text(
            'Which model answers your questions and reads your patterns.',
            style: sectionMutedStyle(context),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            key: ValueKey('ai-model-$_model'),
            initialValue:
                _aiModelOptions.any((o) => o.value == _model) ? _model : null,
            dropdownColor: const Color(0xFF1A1224),
            isExpanded: true,
            style: TextStyle(
              fontSize: 15,
              color: Colors.white.withValues(alpha: 0.92),
            ),
            items: [
              for (final opt in _aiModelOptions)
                DropdownMenuItem(
                  value: opt.value,
                  child: Text('${opt.label} (${opt.group.toLowerCase()})'),
                ),
            ],
            onChanged: _loading
                ? null
                : (value) async {
                    if (value == null || value == _model) return;
                    final previous = _model;
                    setState(() {
                      _model = value;
                      _savingModel = true;
                    });
                    final ok = await _update({'ai_model_preference': value});
                    if (!mounted) return;
                    setState(() {
                      _savingModel = false;
                      if (!ok) _model = previous;
                    });
                  },
          ),
          const SizedBox(height: 6),
          Text(
            _aiModelOptions
                .firstWhere((o) => o.value == _model,
                    orElse: () => _aiModelOptions.first)
                .hint,
            style: sectionMutedStyle(context),
          ),
          _rowDivider(),

          // Floating Ask button.
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _labelWithIcon(context, Icons.chat_bubble_outline,
                        'Floating Ask button',
                        saving: _savingFab),
                    const SizedBox(height: 4),
                    Text(
                      'Show a small Ask Purple bubble on every screen so you '
                      "can chat without leaving what you're doing.",
                      style: sectionMutedStyle(context),
                    ),
                  ],
                ),
              ),
              Switch(
                value: _fab,
                onChanged: _loading
                    ? null
                    : (next) async {
                        setState(() {
                          _fab = next;
                          _savingFab = true;
                        });
                        final ok =
                            await _update({'floating_ask_enabled': next});
                        if (!mounted) return;
                        setState(() {
                          _savingFab = false;
                          if (!ok) _fab = !next;
                        });
                      },
              ),
            ],
          ),
          _rowDivider(),

          // Sleep window.
          _labelWithIcon(context, Icons.dark_mode_outlined, 'Sleep window'),
          const SizedBox(height: 4),
          Text(
            'Doses that fall during your sleep are flagged with a moon icon '
            'so you know to take them when you wake.',
            style: sectionMutedStyle(context),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _TimeField(
                  label: 'Wake',
                  value: _displayTime(context, _wakeTime),
                  enabled: !_loading,
                  onTap: () => _pickTime(
                    current: _wakeTime,
                    onPicked: (value) async {
                      final ok = await _update({'wake_time': value});
                      if (ok && mounted) setState(() => _wakeTime = value);
                    },
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _TimeField(
                  label: 'Sleep',
                  value: _displayTime(context, _sleepTime),
                  enabled: !_loading,
                  onTap: () => _pickTime(
                    current: _sleepTime,
                    onPicked: (value) async {
                      final ok = await _update({'sleep_time': value});
                      if (ok && mounted) setState(() => _sleepTime = value);
                    },
                  ),
                ),
              ),
            ],
          ),
          _rowDivider(),

          // Reminder snooze.
          _labelWithIcon(
              context, Icons.notifications_none_rounded, 'Reminder snooze'),
          const SizedBox(height: 4),
          Text(
            'How long "Snooze" pushes a dose reminder out, and how often a '
            'critical-style alarm repeats.',
            style: sectionMutedStyle(context),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<int>(
            key: ValueKey('snooze-$_snoozeMinutes'),
            initialValue: const [5, 10, 15].contains(_snoozeMinutes)
                ? _snoozeMinutes
                : null,
            dropdownColor: const Color(0xFF1A1224),
            style: TextStyle(
              fontSize: 15,
              color: Colors.white.withValues(alpha: 0.92),
            ),
            items: const [
              DropdownMenuItem(value: 5, child: Text('5 minutes')),
              DropdownMenuItem(value: 10, child: Text('10 minutes')),
              DropdownMenuItem(value: 15, child: Text('15 minutes')),
            ],
            onChanged: _loading
                ? null
                : (value) async {
                    if (value == null || value == _snoozeMinutes) return;
                    final previous = _snoozeMinutes;
                    setState(() => _snoozeMinutes = value);
                    final ok = await _update({'snooze_minutes': value});
                    if (!ok && mounted) {
                      setState(() => _snoozeMinutes = previous);
                    }
                  },
          ),
          _rowDivider(),

          // Daily water goal.
          _labelWithIcon(context, Icons.water_drop_outlined, 'Daily water goal',
              saving: _savingGoal),
          const SizedBox(height: 4),
          Text(
            'Target volume used on the Hydration timeline. Between 250 and '
            '10,000 ml.',
            style: sectionMutedStyle(context),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              SizedBox(
                width: 120,
                child: TextField(
                  controller: _waterController,
                  enabled: !_loading,
                  keyboardType: TextInputType.number,
                  style: TextStyle(
                    fontSize: 15,
                    color: Colors.white.withValues(alpha: 0.92),
                  ),
                  onChanged: _scheduleWaterSave,
                ),
              ),
              const SizedBox(width: 8),
              Text('ml', style: sectionMutedStyle(context)),
            ],
          ),
          _rowDivider(),

          // Quiet hours.
          _labelWithIcon(context, Icons.bedtime_outlined, 'Quiet hours'),
          const SizedBox(height: 4),
          Text(
            'Dose reminders go silent during this window. The dose still '
            "shows on Today, Purple just doesn't push a notification.",
            style: sectionMutedStyle(context),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _TimeField(
                  label: 'From',
                  value: _displayTime(context, _quietStart),
                  enabled: !_loading,
                  onTap: () => _pickTime(
                    current: _quietStart,
                    onPicked: (value) async {
                      final ok = await _update({'quiet_hours_start': value});
                      if (ok && mounted) setState(() => _quietStart = value);
                    },
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _TimeField(
                  label: 'Until',
                  value: _displayTime(context, _quietEnd),
                  enabled: !_loading,
                  onTap: () => _pickTime(
                    current: _quietEnd,
                    onPicked: (value) async {
                      final ok = await _update({'quiet_hours_end': value});
                      if (ok && mounted) setState(() => _quietEnd = value);
                    },
                  ),
                ),
              ),
            ],
          ),
          if (_quietStart != null || _quietEnd != null) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: () async {
                final ok = await _update({
                  'quiet_hours_start': null,
                  'quiet_hours_end': null,
                });
                if (ok && mounted) {
                  setState(() {
                    _quietStart = null;
                    _quietEnd = null;
                  });
                }
              },
              child: const Text('Clear'),
            ),
          ],
          _rowDivider(),

          // Weekly recap email.
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _labelWithIcon(context, Icons.mark_email_read_outlined,
                        'Weekly recap email',
                        saving: _savingDigest),
                    const SizedBox(height: 4),
                    Text(
                      'A short Sunday summary of your week, events, doses, '
                      'and one pattern Purple noticed.',
                      style: sectionMutedStyle(context),
                    ),
                  ],
                ),
              ),
              Switch(
                value: _weeklyDigest,
                onChanged: _loading
                    ? null
                    : (next) async {
                        setState(() {
                          _weeklyDigest = next;
                          _savingDigest = true;
                        });
                        final ok =
                            await _update({'weekly_digest_enabled': next});
                        if (!mounted) return;
                        setState(() {
                          _savingDigest = false;
                          if (!ok) _weeklyDigest = !next;
                        });
                      },
              ),
            ],
          ),
          _rowDivider(),

          // How Purple thinks.
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => context.go(AppRoutes.settingsHowPurpleThinks),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Icon(Icons.menu_book_outlined,
                        size: 16, color: primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('How Purple thinks',
                              style: sectionRowTitleStyle(context)),
                          Text(
                            'What it reads, when it acts, what stays private.',
                            style: sectionMutedStyle(context),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      Icons.chevron_right,
                      size: 18,
                      color: Colors.white.withValues(alpha: 0.35),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ConditionChip extends StatelessWidget {
  const _ConditionChip({
    required this.label,
    required this.active,
    required this.onTap,
    this.enabled = true,
    this.removable = false,
  });

  final String label;
  final bool active;
  final bool enabled;
  final bool removable;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            color: active
                ? primary.withValues(alpha: 0.85)
                : Colors.white.withValues(alpha: 0.04),
            border: Border.all(
              color: active
                  ? primary
                  : Colors.white.withValues(alpha: 0.15),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: active
                      ? Colors.white
                      : Colors.white.withValues(alpha: 0.92),
                ),
              ),
              if (removable && active) ...[
                const SizedBox(width: 4),
                const Icon(Icons.close, size: 12, color: Colors.white),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TimeField extends StatelessWidget {
  const _TimeField({
    required this.label,
    required this.value,
    required this.enabled,
    required this.onTap,
  });

  final String label;
  final String value;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          constraints: const BoxConstraints(minHeight: 48),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: Colors.white.withValues(alpha: 0.04),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: sectionMutedStyle(context)),
              Text(
                value,
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.white.withValues(alpha: 0.92),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// AI provider section (web `ai-provider-section.tsx`). Saving writes
/// `profiles.ai_provider`, the same column the web server fn updates.
class AiProviderSection extends StatefulWidget {
  const AiProviderSection({super.key});

  @override
  State<AiProviderSection> createState() => _AiProviderSectionState();
}

class _AiProviderOption {
  const _AiProviderOption(this.id, this.name, this.blurb,
      {this.disabled = false, this.disabledReason});

  final String id;
  final String name;
  final String blurb;
  final bool disabled;
  final String? disabledReason;
}

const _aiProviderOptions = <_AiProviderOption>[
  _AiProviderOption('claude', 'Anthropic Claude',
      'Default. Strong at lab reports, imaging summaries, and chat. Reads PDFs and images.'),
  _AiProviderOption(
      'openai', 'OpenAI GPT', 'Fast all-rounder. Reads images, not PDFs.'),
  _AiProviderOption('gemini', 'Google Gemini',
      'Big context window. Reads PDFs and images.'),
  _AiProviderOption(
      'grok', 'xAI Grok', 'Strong reasoning. Reads images, not PDFs.'),
  _AiProviderOption(
      'maya', 'Maya (internal)', "Purple's own model. Not configured yet.",
      disabled: true, disabledReason: 'Endpoint not set'),
];

class _AiProviderSectionState extends State<AiProviderSection> {
  String _current = 'claude';
  bool _loading = true;
  String? _saving;

  SupabaseClient get _client => Supabase.instance.client;

  String? get _userId => _client.auth.currentSession?.user.id;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = _userId;
    if (userId == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final row = await _client
          .from('profiles')
          .select('ai_provider')
          .eq('id', userId)
          .maybeSingle();
      if (!mounted) return;
      setState(() {
        _current = (row?['ai_provider'] as String?) ?? 'claude';
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pick(_AiProviderOption option) async {
    final userId = _userId;
    if (userId == null ||
        option.disabled ||
        option.id == _current ||
        _saving != null) {
      return;
    }
    setState(() => _saving = option.id);
    try {
      await _client
          .from('profiles')
          .update({'ai_provider': option.id}).eq('id', userId);
      if (!mounted) return;
      setState(() {
        _current = option.id;
        _saving = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _saving = null);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Couldn't save provider")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return GlassSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome_outlined, size: 16, color: primary),
              const SizedBox(width: 8),
              Text('AI provider', style: sectionTitleStyle(context)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Your report extraction, Ask Purple chat, and insights all run on '
            'the provider you pick here. Keys live server-side; we never '
            'expose them to the browser.',
            style: sectionMutedStyle(context),
          ),
          const SizedBox(height: 16),
          for (final option in _aiProviderOptions) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _loading || option.disabled
                      ? null
                      : () => _pick(option),
                  borderRadius: BorderRadius.circular(14),
                  child: Opacity(
                    opacity: option.disabled ? 0.6 : 1,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        color: _current == option.id
                            ? primary.withValues(alpha: 0.06)
                            : Colors.white.withValues(alpha: 0.03),
                        border: Border.all(
                          color: _current == option.id
                              ? primary.withValues(alpha: 0.6)
                              : Colors.white.withValues(alpha: 0.1),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(option.name,
                                          style:
                                              sectionRowTitleStyle(context)),
                                    ),
                                    if (option.disabledReason != null) ...[
                                      const SizedBox(width: 8),
                                      Text(
                                        option.disabledReason!.toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 10,
                                          letterSpacing: 0.8,
                                          color: Colors.white
                                              .withValues(alpha: 0.45),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(option.blurb,
                                    style: sectionMutedStyle(context)),
                              ],
                            ),
                          ),
                          if (_saving == option.id)
                            SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white.withValues(alpha: 0.5),
                              ),
                            )
                          else if (_current == option.id)
                            Icon(Icons.check, size: 16, color: primary),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// "What I track" section (web `what-i-track-section.tsx`). Writes
/// `profiles.feature_overrides` like the web page.
class WhatITrackSection extends StatefulWidget {
  const WhatITrackSection({super.key});

  @override
  State<WhatITrackSection> createState() => _WhatITrackSectionState();
}

class _WhatITrackSectionState extends State<WhatITrackSection> {
  bool _loading = true;
  List<String> _conditions = [];
  Map<String, bool> _overrides = {};
  String? _savingKey;

  SupabaseClient get _client => Supabase.instance.client;

  String? get _userId => _client.auth.currentSession?.user.id;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = _userId;
    if (userId == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final row = await _client
          .from('profiles')
          .select('conditions, feature_overrides')
          .eq('id', userId)
          .maybeSingle();
      if (!mounted) return;
      setState(() {
        final conditions = row?['conditions'];
        if (conditions is List) {
          _conditions = conditions.whereType<String>().toList();
        }
        final raw = row?['feature_overrides'];
        if (raw is Map) {
          _overrides = raw.map(
            (key, value) => MapEntry('$key', value == true),
          );
        }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _setOverride(String key, bool? value) async {
    final userId = _userId;
    if (userId == null) return;
    final next = Map<String, bool>.from(_overrides);
    if (value == null) {
      next.remove(key);
    } else {
      next[key] = value;
    }
    setState(() {
      _overrides = next;
      _savingKey = key;
    });
    try {
      await _client
          .from('profiles')
          .update({'feature_overrides': next}).eq('id', userId);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Couldn't save preference")),
        );
      }
    } finally {
      if (mounted) setState(() => _savingKey = null);
    }
  }

  Future<void> _resetAll() async {
    final userId = _userId;
    if (userId == null) return;
    setState(() => _overrides = {});
    try {
      await _client
          .from('profiles')
          .update({'feature_overrides': <String, bool>{}}).eq('id', userId);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Couldn't reset")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final groups = groupedFeatures();

    return GlassSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.visibility_outlined,
                            size: 16, color: primary),
                        const SizedBox(width: 8),
                        Text('What I track', style: sectionTitleStyle(context)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Each tracker turns on by default for the conditions it '
                      "helps with. Turn anything on or off, your call, not your "
                      "diagnosis's.",
                      style: sectionMutedStyle(context),
                    ),
                  ],
                ),
              ),
              if (_overrides.isNotEmpty)
                TextButton(
                  onPressed: _loading ? null : _resetAll,
                  child: const Text('Reset to defaults'),
                ),
            ],
          ),
          const SizedBox(height: 16),
          for (final group in groups) ...[
            Text(
              (categoryLabels[group.key] ?? group.key).toUpperCase(),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.2,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
            ),
            const SizedBox(height: 10),
            for (final feature in group.value) ...[
              _FeatureToggleRow(
                feature: feature,
                enabled: isFeatureEnabled(
                    feature.key, _conditions, _overrides),
                hasOverride: _overrides.containsKey(feature.key),
                loading: _loading,
                saving: _savingKey == feature.key,
                conditions: _conditions,
                onChanged: (checked) {
                  final defaultOn =
                      isFeatureEnabled(feature.key, _conditions, null);
                  _setOverride(
                    feature.key,
                    checked == defaultOn ? null : checked,
                  );
                },
              ),
              const SizedBox(height: 12),
            ],
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}

class _FeatureToggleRow extends StatelessWidget {
  const _FeatureToggleRow({
    required this.feature,
    required this.enabled,
    required this.hasOverride,
    required this.loading,
    required this.saving,
    required this.conditions,
    required this.onChanged,
  });

  final FeatureDef feature;
  final bool enabled;
  final bool hasOverride;
  final bool loading;
  final bool saving;
  final List<String> conditions;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final reason = featureDefaultReason(feature, conditions);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(feature.label,
                        style: sectionRowTitleStyle(context)),
                  ),
                  if (feature.requiresDevice) ...[
                    const SizedBox(width: 8),
                    Text(
                      'DEVICE',
                      style: TextStyle(
                        fontSize: 10,
                        letterSpacing: 0.8,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                    ),
                  ],
                ],
              ),
              Text(feature.description, style: sectionMutedStyle(context)),
              Text(
                '$reason${hasOverride ? ' · You set this manually' : ''}',
                style: sectionMutedStyle(context),
              ),
            ],
          ),
        ),
        if (saving)
          SizedBox(
            width: 14,
            height: 14,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white.withValues(alpha: 0.5),
            ),
          )
        else
          Switch(
            value: enabled,
            onChanged: loading ? null : onChanged,
          ),
      ],
    );
  }
}

/// Health history section (web `condition-history-section.tsx`).
class ConditionHistorySection extends StatefulWidget {
  const ConditionHistorySection({super.key});

  @override
  State<ConditionHistorySection> createState() =>
      _ConditionHistorySectionState();
}

class _ConditionHistorySectionState extends State<ConditionHistorySection> {
  bool _loading = true;
  bool _saving = false;
  bool _picking = false;
  List<String> _active = [];
  List<Map<String, dynamic>> _archived = [];
  List<Map<String, dynamic>> _family = [];
  final _famConditionController = TextEditingController();
  final _famRelationController = TextEditingController();

  SupabaseClient get _client => Supabase.instance.client;

  String? get _userId => _client.auth.currentSession?.user.id;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _famConditionController.dispose();
    _famRelationController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final userId = _userId;
    if (userId == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final row = await _client
          .from('profiles')
          .select('conditions, conditions_archived, family_history')
          .eq('id', userId)
          .maybeSingle();
      if (!mounted) return;
      setState(() {
        final conditions = row?['conditions'];
        if (conditions is List) {
          _active = conditions.whereType<String>().toList();
        }
        final archived = row?['conditions_archived'];
        if (archived is List) {
          _archived = archived.whereType<Map<String, dynamic>>().toList();
        }
        final family = row?['family_history'];
        if (family is List) {
          _family = family.whereType<Map<String, dynamic>>().toList();
        }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<bool> _persist(Map<String, dynamic> patch) async {
    final userId = _userId;
    if (userId == null) return false;
    setState(() => _saving = true);
    try {
      await _client.from('profiles').update(patch).eq('id', userId);
      return true;
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Couldn't save")),
        );
      }
      return false;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _archive(String condition, String status) async {
    final nextActive = _active.where((c) => c != condition).toList();
    final nextArchived = [
      ..._archived.where((a) => a['id'] != condition),
      {
        'id': condition,
        'label': conditionLabel(condition),
        'status': status,
        'archived_at': DateTime.now().toUtc().toIso8601String(),
      },
    ];
    setState(() {
      _active = nextActive;
      _archived = nextArchived;
    });
    await _persist({
      'conditions': nextActive,
      'conditions_archived': nextArchived,
    });
  }

  Future<void> _restore(Map<String, dynamic> item) async {
    final id = '${item['id']}';
    final nextArchived = _archived.where((a) => a['id'] != id).toList();
    final nextActive = _active.contains(id) ? _active : [..._active, id];
    setState(() {
      _active = nextActive;
      _archived = nextArchived;
    });
    await _persist({
      'conditions': nextActive,
      'conditions_archived': nextArchived,
    });
  }

  Future<void> _removeArchived(Map<String, dynamic> item) async {
    final id = '${item['id']}';
    final nextArchived = _archived.where((a) => a['id'] != id).toList();
    setState(() => _archived = nextArchived);
    await _persist({'conditions_archived': nextArchived});
  }

  Future<void> _addFamily() async {
    final condition = _famConditionController.text.trim();
    if (condition.isEmpty) return;
    final next = [
      ..._family,
      {
        'id': DateTime.now().microsecondsSinceEpoch.toRadixString(36),
        'condition': condition.length > 80 ? condition.substring(0, 80) : condition,
        'relation': _famRelationController.text.trim().isEmpty
            ? null
            : _famRelationController.text.trim(),
      },
    ];
    setState(() => _family = next);
    _famConditionController.clear();
    _famRelationController.clear();
    await _persist({'family_history': next});
  }

  Future<void> _removeFamily(String id) async {
    final next = _family.where((f) => '${f['id']}' != id).toList();
    setState(() => _family = next);
    await _persist({'family_history': next});
  }

  String _archivedSubtitle(Map<String, dynamic> item) {
    final status =
        item['status'] == 'resolved' ? 'Resolved' : 'In remission';
    final archivedAt = DateTime.tryParse('${item['archived_at'] ?? ''}');
    if (archivedAt == null) return status;
    return '$status \u00b7 ${DateFormat.yMd().format(archivedAt.toLocal())}';
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return GlassSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.inventory_2_outlined, size: 16, color: primary),
              const SizedBox(width: 8),
              Text('Health history', style: sectionTitleStyle(context)),
              if (_saving) ...[
                const SizedBox(width: 8),
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Conditions evolve. Mark something as resolved or in remission, '
            'or note what runs in the family.',
            style: sectionMutedStyle(context),
          ),
          const SizedBox(height: 16),
          Text('Currently active', style: sectionRowTitleStyle(context)),
          const SizedBox(height: 4),
          Text(
            'Resolve removes it from prompts and trackers; in remission keeps '
            'it visible but quiet.',
            style: sectionMutedStyle(context),
          ),
          const SizedBox(height: 8),
          if (_loading)
            Text('Loading', style: sectionMutedStyle(context))
          else if (_active.isEmpty)
            Text('Nothing active yet.', style: sectionMutedStyle(context))
          else
            Column(
              children: [
                for (final c in _active)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        border:
                            Border.all(color: Colors.white.withValues(alpha: 0.1)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              conditionLabel(c),
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white.withValues(alpha: 0.92),
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: _loading || _saving
                                ? null
                                : () => _archive(c, 'remission'),
                            child: const Text('In remission'),
                          ),
                          TextButton(
                            onPressed: _loading || _saving
                                ? null
                                : () => _archive(c, 'resolved'),
                            child: const Text('Resolved'),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          OutlinedButton.icon(
            onPressed: _loading ? null : () => setState(() => _picking = !_picking),
            icon: Icon(_picking ? Icons.check : Icons.add, size: 16),
            label: Text(_picking ? 'Done' : 'Add condition'),
          ),
          if (_picking) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final entry in conditionLabels.entries)
                  _ConditionChip(
                    label: entry.value,
                    active: _active.contains(entry.key),
                    enabled: !_loading && !_saving,
                    onTap: () async {
                      final next = _active.contains(entry.key)
                          ? _active.where((c) => c != entry.key).toList()
                          : [..._active, entry.key];
                      setState(() => _active = next);
                      await _persist({'conditions': next});
                    },
                  ),
              ],
            ),
          ],
          if (_archived.isNotEmpty) ...[
            _rowDivider(),
            Text('Past / resolved', style: sectionRowTitleStyle(context)),
            const SizedBox(height: 8),
            for (final item in _archived)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${item['label'] ?? conditionLabel('${item['id']}')}',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white.withValues(alpha: 0.92),
                              ),
                            ),
                            Text(_archivedSubtitle(item),
                                style: sectionMutedStyle(context)),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: _loading || _saving
                            ? null
                            : () => _restore(item),
                        child: const Text('Restore'),
                      ),
                      IconButton(
                        onPressed: _loading || _saving
                            ? null
                            : () => _removeArchived(item),
                        icon: Icon(Icons.close,
                            size: 16,
                            color: Colors.white.withValues(alpha: 0.5)),
                      ),
                    ],
                  ),
                ),
              ),
          ],
          _rowDivider(),
          Row(
            children: [
              Icon(Icons.people_outline, size: 16, color: primary),
              const SizedBox(width: 8),
              Text('Family history', style: sectionRowTitleStyle(context)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'What runs in your family. Used as context for patterns and AI '
            'suggestions, never shared.',
            style: sectionMutedStyle(context),
          ),
          if (_family.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final item in _family)
                  InputChip(
                    label: Text(
                      item['relation'] != null &&
                              '${item['relation']}'.isNotEmpty
                          ? '${item['condition']} · ${item['relation']}'
                          : '${item['condition']}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withValues(alpha: 0.92),
                      ),
                    ),
                    onDeleted: _loading || _saving
                        ? null
                        : () => _removeFamily('${item['id']}'),
                    deleteIconColor: Colors.white.withValues(alpha: 0.5),
                    backgroundColor: Colors.white.withValues(alpha: 0.04),
                    side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _famConditionController,
                  enabled: !_loading && !_saving,
                  decoration: InputDecoration(
                    hintText: 'Condition (e.g. Heart attack)',
                    hintStyle:
                        TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.04),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                          color: Colors.white.withValues(alpha: 0.1)),
                    ),
                  ),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(alpha: 0.92),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 120,
                child: TextField(
                  controller: _famRelationController,
                  enabled: !_loading && !_saving,
                  decoration: InputDecoration(
                    hintText: 'Relation',
                    hintStyle:
                        TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.04),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                          color: Colors.white.withValues(alpha: 0.1)),
                    ),
                  ),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(alpha: 0.92),
                  ),
                  onSubmitted: (_) => _addFamily(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _loading ||
                    _saving ||
                    _famConditionController.text.trim().isEmpty
                ? null
                : _addFamily,
            icon: const Icon(Icons.add, size: 16),
            label: const Text('Add'),
          ),
        ],
      ),
    );
  }
}

/// "Your data" section (web `data-section.tsx`): export zip + soft delete.
class DataSection extends StatefulWidget {
  const DataSection({super.key});

  @override
  State<DataSection> createState() => _DataSectionState();
}

class _DataSectionState extends State<DataSection> {
  bool _exporting = false;
  bool _loadingStatus = true;
  DeletionStatus? _pendingDeletion;
  bool _restoring = false;

  SupabaseClient get _client => Supabase.instance.client;

  String? get _userId => _client.auth.currentSession?.user.id;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    final userId = _userId;
    if (userId == null) {
      if (mounted) setState(() => _loadingStatus = false);
      return;
    }
    try {
      final status = await checkDeletionStatus(_client, userId);
      if (mounted) setState(() => _pendingDeletion = status);
    } finally {
      if (mounted) setState(() => _loadingStatus = false);
    }
  }

  Future<void> _export() async {
    setState(() => _exporting = true);
    try {
      await exportAllUserData(_client);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your archive is downloading')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e is StateError ? e.message : 'Export failed')),
      );
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  Future<void> _restore() async {
    setState(() => _restoring = true);
    try {
      await restoreUserData(_client);
      if (!mounted) return;
      setState(() => _pendingDeletion = null);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your account has been restored.')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "The restore didn't finish. Nothing was changed, try again in a moment.",
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _restoring = false);
    }
  }

  Future<void> _confirmDelete() async {
    final user = _client.auth.currentSession?.user;
    if (user == null) return;
    final needsPassword = userHasPasswordIdentity(user);
    final confirmController = TextEditingController();
    final passwordController = TextEditingController();
    var deleting = false;

    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final canDelete = confirmController.text.trim() == 'DELETE' &&
                (!needsPassword || passwordController.text.isNotEmpty) &&
                !deleting;
            return AlertDialog(
              backgroundColor: const Color(0xFF14101C),
              title: Text('Delete everything?',
                  style: sectionTitleStyle(context)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'This schedules every journal entry, biometric reading, '
                      'medication, seizure log, and uploaded file tied to your '
                      'account for permanent deletion.\n\n'
                      'You will have $restoreWindowDays days to restore by signing '
                      'back in. After that, everything is permanently erased.',
                      style: sectionMutedStyle(context),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: confirmController,
                      decoration: const InputDecoration(
                        labelText: 'Type DELETE to confirm',
                      ),
                      onChanged: (_) => setDialogState(() {}),
                    ),
                    if (needsPassword) ...[
                      const SizedBox(height: 12),
                      TextField(
                        controller: passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Re-enter your password',
                        ),
                        onChanged: (_) => setDialogState(() {}),
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: deleting
                      ? null
                      : () => Navigator.of(dialogContext).pop(),
                  child: const Text('Keep my data'),
                ),
                FilledButton(
                  onPressed: canDelete
                      ? () async {
                          setDialogState(() => deleting = true);
                          try {
                            if (needsPassword) {
                              await softDeleteUserData(
                                _client,
                                password: passwordController.text,
                              );
                            } else {
                              await softDeleteAuthenticatedUser(_client);
                            }
                            if (!dialogContext.mounted) return;
                            Navigator.of(dialogContext).pop();
                            await _client.auth.signOut();
                            if (!mounted) return;
                            GoRouter.of(this.context).go('/sign-in');
                          } catch (e) {
                            setDialogState(() => deleting = false);
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  e is AuthException
                                      ? e.message
                                      : 'Delete failed',
                                ),
                              ),
                            );
                          }
                        }
                      : null,
                  child: deleting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Schedule deletion'),
                ),
              ],
            );
          },
        );
      },
    );
    confirmController.dispose();
    passwordController.dispose();
  }

  int? get _daysRemaining {
    final purge = _pendingDeletion?.purgeAfter;
    if (purge == null) return null;
    return purge.difference(DateTime.now()).inDays.clamp(0, restoreWindowDays);
  }

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your data', style: sectionTitleStyle(context)),
          const SizedBox(height: 4),
          Text(
            'Take it with you anytime. Deletion is reversible for '
            '$restoreWindowDays days, after that, everything is permanently '
            'erased.',
            style: sectionMutedStyle(context),
          ),
          if (_pendingDeletion != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: Theme.of(context).colorScheme.error.withValues(alpha: 0.1),
                border: Border.all(
                  color: Theme.of(context).colorScheme.error.withValues(alpha: 0.35),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your account is scheduled for deletion',
                    style: sectionRowTitleStyle(context),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Requested ${_pendingDeletion!.deletedAt.toLocal().toString().split(' ').first}.'
                    '${_daysRemaining != null ? ' Permanent purge in $_daysRemaining day${_daysRemaining == 1 ? '' : 's'}.' : ''}',
                    style: sectionMutedStyle(context),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: _restoring ? null : _restore,
                    child: _restoring
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Restore my account'),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              OutlinedButton.icon(
                onPressed: _exporting || _loadingStatus ? null : _export,
                icon: _exporting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.download_outlined, size: 18),
                label: const Text('Export your data'),
              ),
              if (_pendingDeletion == null)
                TextButton.icon(
                  onPressed: _confirmDelete,
                  icon: Icon(
                    Icons.delete_outline,
                    size: 18,
                    color: Theme.of(context).colorScheme.error,
                  ),
                  label: Text(
                    'Delete account',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Opens a marketing or docs URL in the platform browser.
Future<void> openPurpleUrl(String path) async {
  final uri = Uri.parse('https://www.purplelife.org$path');
  final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!ok) {
    throw StateError('Could not open $uri');
  }
}

/// About section (web `about-section.tsx`): Founding charter, Privacy &
/// safety, Open source on GitHub.
class AboutSection extends StatelessWidget {
  const AboutSection({super.key});

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
            child: Text('About', style: sectionTitleStyle(context)),
          ),
          Divider(height: 1, color: Colors.white.withValues(alpha: 0.08)),
          _AboutRow(
            icon: Icons.description_outlined,
            title: 'Founding charter',
            onTap: () async {
              try {
                await openPurpleUrl('/charter');
              } catch (_) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Could not open founding charter')),
                  );
                }
              }
            },
          ),
          Divider(height: 1, color: Colors.white.withValues(alpha: 0.08)),
          _AboutRow(
            icon: Icons.verified_user_outlined,
            title: 'Privacy & safety',
            onTap: () => context.go(AppRoutes.settingsPrivacy),
          ),
          Divider(height: 1, color: Colors.white.withValues(alpha: 0.08)),
          _AboutRow(
            icon: Icons.code,
            title: 'Open source on GitHub',
            external: true,
            onTap: () async {
              final uri = Uri.parse('https://github.com/AstroAii/purpledrw');
              final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
              if (!ok && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Could not open GitHub')),
                );
              }
            },
          ),
        ],
      ),
    );
  }
}

class _AboutRow extends StatelessWidget {
  const _AboutRow({
    required this.icon,
    required this.title,
    required this.onTap,
    this.external = false,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final bool external;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 56),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.08),
                ),
                child: Icon(
                  icon,
                  size: 15,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(title, style: sectionRowTitleStyle(context)),
              ),
              Icon(
                external ? Icons.open_in_new : Icons.chevron_right,
                size: 16,
                color: Colors.white.withValues(alpha: 0.35),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
