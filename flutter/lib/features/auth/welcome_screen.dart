import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/onboarding_gate.dart';
import '../../core/providers/core_providers.dart';
import '../../design/glass_card.dart';
import '../../design/purple_theme.dart';
import '../../shell/routes.dart';
import '../health/welcome_apple_health_card.dart';
import '../my_health/condition_catalog.dart';
import '../shared/glass_helpers.dart' hide GlassCard;
import '../shared/merged_style.dart';
import 'onboarding_style.dart';

// Web welcome (src/routes/_app/welcome.tsx) also auto-redeems stored invite
// codes (redeemInviteCode) and fires generateCareProfile after saving the
// profile. Both are TanStack server functions with no Worker API route yet,
// so the Flutter app cannot call them.
// TODO(worker-routes): redeem invite codes + trigger care-profile generation
// once /api routes exist for invite-codes.functions.ts and
// care-profile.functions.ts. Deliberately no placeholder UI for either —
// nothing here should promise what the app can't do yet.

/// Max conditions a user can pick, mirroring web `ConditionPicker` `max = 12`.
const _maxConditions = 12;

/// Category labels mirrored from web `condition-picker.tsx` CATEGORY_LABELS.
const _categoryLabels = <String, String>{
  'neuro': 'Neurological',
  'neurodevelopmental': 'Neurodevelopmental',
  'mental_health': 'Mental health',
  'pain_fatigue': 'Pain & fatigue',
  'cardio_metabolic': 'Heart & metabolic',
  'autoimmune': 'Autoimmune & inflammatory',
  'respiratory': 'Respiratory',
  'gi': 'Gut & digestive',
  'oncology': 'Cancer',
  'caregiver': 'Caregiver context',
  'general': 'Other',
};

/// Category display order mirrored from web `condition-picker.tsx`.
const _categoryOrder = <String>[
  'neuro',
  'neurodevelopmental',
  'mental_health',
  'pain_fatigue',
  'cardio_metabolic',
  'autoimmune',
  'respiratory',
  'gi',
  'oncology',
  'caregiver',
  'general',
];

/// Every catalog slug; labels/categories resolve read-only through
/// `getConditions` so copy stays in lockstep with the shared catalog.
const _allConditionSlugs = <String>[
  'epilepsy', 'migraine', 'cluster_headache', 'parkinsons',
  'multiple_sclerosis', 'stroke_recovery', 'neuropathy',
  'autism', 'adhd', 'dementia',
  'depression', 'anxiety', 'bipolar', 'ptsd', 'ocd', 'eating_disorder',
  'fibromyalgia', 'chronic_pain', 'long_covid', 'pots', 'eds',
  'hypertension', 't1_diabetes', 't2_diabetes', 'prediabetes',
  'high_cholesterol', 'afib', 'heart_failure', 'ckd',
  'rheumatoid_arthritis', 'lupus', 'crohns', 'ulcerative_colitis',
  'psoriasis', 'hashimotos', 'celiac',
  'asthma', 'copd', 'sleep_apnea',
  'ibs', 'gerd',
  'cancer',
  'caregiver', 'general',
];

/// Onboarding gate for users without profile onboarding metadata.
///
/// Ports web welcome step 0 (`src/routes/_app/welcome.tsx`): first/last name
/// plus a conditions picker writing `profiles.conditions`. The Apple Health
/// connect card covers the web "devices" step on iPhone.
class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final List<String> _conditions = [];
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _prefillFromProfile();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    super.dispose();
  }

  /// Prefill from the existing profile so a returning user never re-enters
  /// what's already saved (mirrors web welcome prefill effect).
  Future<void> _prefillFromProfile() async {
    try {
      final client = ref.read(supabaseClientProvider);
      final userId = client.auth.currentUser?.id;
      if (userId == null) return;
      final row = await client
          .from('profiles')
          .select('first_name, last_name, conditions')
          .eq('id', userId)
          .maybeSingle();
      if (!mounted || row == null) return;
      setState(() {
        final first = row['first_name'] as String?;
        final last = row['last_name'] as String?;
        if (first != null && _firstNameController.text.isEmpty) {
          _firstNameController.text = first;
        }
        if (last != null && _lastNameController.text.isEmpty) {
          _lastNameController.text = last;
        }
        final conditions = row['conditions'];
        if (conditions is List && _conditions.isEmpty) {
          _conditions.addAll(conditions.whereType<String>());
        }
      });
    } catch (_) {
      // Prefill is best-effort; the form still works from a blank state.
    }
  }

  void _toggleCondition(String slug) {
    setState(() {
      if (_conditions.contains(slug)) {
        _conditions.remove(slug);
      } else if (_conditions.length < _maxConditions) {
        _conditions.add(slug);
      }
    });
  }

  Future<void> _completeOnboarding() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final client = ref.read(supabaseClientProvider);
      final user = client.auth.currentUser;
      if (user == null) {
        if (!mounted) return;
        context.go(AppRoutes.signIn);
        return;
      }

      final firstName = _firstNameController.text.trim();
      final lastName = _lastNameController.text.trim();
      // Same field set as web `saveProfile` (minus locale, which Account owns
      // in the app): only what this flow collects, so anything a returning
      // user already saved stays untouched.
      await client.from('profiles').upsert({
        'id': user.id,
        'first_name': firstName.isEmpty ? null : firstName,
        'last_name': lastName.isEmpty ? null : lastName,
        'conditions': _conditions,
        'onboarded_at': DateTime.now().toUtc().toIso8601String(),
      }, onConflict: 'id');

      await markOnboardedCache(user.id);

      if (!mounted) return;
      context.go(AppRoutes.today);
    } catch (error, stack) {
      debugPrint('[WelcomeScreen] onboarding save failed: $error\n$stack');
      if (!mounted) return;
      setState(() {
        _error = 'Could not finish setup. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: purpleCanvasDark,
      body: CanvasBackground(
        auth: true,
        child: SafeArea(
          child: SingleChildScrollView(
            child: ContentColumn(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Let me know who you are.',
                    style: onboardingTitle(),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Just your first name, and what you are carrying. '
                    'Everything else can wait.',
                    style: onboardingSubtitle(),
                  ),
                  const SizedBox(height: 24),
                  GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: _NameField(
                                controller: _firstNameController,
                                label: 'First name',
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _NameField(
                                controller: _lastNameController,
                                label: 'Last name',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'WHAT BRINGS YOU TO PURPLE?',
                          style: onboardingEyebrow(),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Pick anything that applies. You can change this '
                          'later in My Health.',
                          style: onboardingHint(),
                        ),
                        const SizedBox(height: 12),
                        _ConditionPicker(
                          selected: _conditions,
                          onToggle: _toggleCondition,
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _error!,
                            style: const TextStyle(color: Color(0xFFE8745C)),
                          ),
                        ],
                        const SizedBox(height: 20),
                        FilledButton(
                          onPressed: _saving ? null : _completeOnboarding,
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(48),
                          ),
                          child:
                              Text(_saving ? 'Saving...' : 'Continue to Today'),
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: _saving ? null : _completeOnboarding,
                          style: TextButton.styleFrom(
                            minimumSize: const Size.fromHeight(44),
                          ),
                          child: const Text('Skip for now'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  WelcomeAppleHealthCard(
                    onConnected: () {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Apple Health connected. Vitals synced.'),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NameField extends StatelessWidget {
  const _NameField({required this.controller, required this.label});

  final TextEditingController controller;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: onboardingFieldLabel(),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          textInputAction: TextInputAction.next,
          textCapitalization: TextCapitalization.words,
          style: TextStyle(color: mergedPalette().textPrimary),
          decoration: onboardingInputDecoration(label),
        ),
      ],
    );
  }
}

/// Grouped condition chips over the shared catalog (web `ConditionPicker`,
/// grouped view; search is omitted since the full list fits one scroll).
class _ConditionPicker extends StatelessWidget {
  const _ConditionPicker({required this.selected, required this.onToggle});

  final List<String> selected;
  final ValueChanged<String> onToggle;

  @override
  Widget build(BuildContext context) {
    final entries = getConditions(_allConditionSlugs);
    final byCategory = <String, List<ConditionCatalogEntry>>{};
    for (final entry in entries) {
      byCategory.putIfAbsent(entry.category, () => []).add(entry);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final category in _categoryOrder)
          if (byCategory.containsKey(category)) ...[
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 8),
              child: Text(
                _categoryLabels[category] ??
                    conditionCategoryLabel(category),
                style: onboardingCategoryLabel(),
              ),
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final entry in byCategory[category]!)
                  _ConditionChip(
                    label: entry.label,
                    selected: selected.contains(entry.slug),
                    onTap: () => onToggle(entry.slug),
                  ),
              ],
            ),
          ],
      ],
    );
  }
}

class _ConditionChip extends StatelessWidget {
  const _ConditionChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            color: selected
                ? primary.withValues(alpha: 0.22)
                : Colors.white.withValues(alpha: 0.04),
            border: Border.all(
              color: selected
                  ? primary.withValues(alpha: 0.6)
                  : Colors.white.withValues(alpha: 0.12),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (selected) ...[
                Icon(Icons.check, size: 14, color: primary),
                const SizedBox(width: 6),
              ],
              Flexible(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white
                            .withValues(alpha: selected ? 0.95 : 0.75),
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
