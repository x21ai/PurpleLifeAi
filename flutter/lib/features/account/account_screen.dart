import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth/auth_state.dart';
import '../../core/providers/core_providers.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../settings/settings_hub.dart';
import '../shared/glass_helpers.dart';
import 'locale_data.dart';
import 'profile_avatar.dart';
import 'theme_preference.dart';

const _genderPresets = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const _genderSelfDescribe = '__self__';

enum _SaveState { idle, saving, saved, error }

/// Account sheet ported from web `src/routes/_app/account.tsx`.
///
/// Profile fields autosave to `profiles` like the web page. Password updates
/// go through Supabase auth. Appearance and locale editing are display-level
/// parity; the app ships dark-only for now.
class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  final _firstController = TextEditingController();
  final _lastController = TextEditingController();
  final _phoneController = TextEditingController();
  final _homeCityController = TextEditingController();
  final _genderCustomController = TextEditingController();

  bool _loading = true;
  bool _loadFailed = false;
  String? _email;
  String _gender = '';
  String? _country;
  String? _timezone;
  String? _locale;
  bool _twoFactorEnabled = false;
  bool _twoFactorKnown = false;
  String? _inviteCode;
  bool _inviteLoading = false;
  bool _inviteCopied = false;

  _SaveState _nameState = _SaveState.idle;
  _SaveState _phoneState = _SaveState.idle;
  _SaveState _genderState = _SaveState.idle;
  _SaveState _localeState = _SaveState.idle;

  Timer? _nameTimer;
  Timer? _phoneTimer;
  Timer? _homeCityTimer;
  Timer? _genderTimer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameTimer?.cancel();
    _phoneTimer?.cancel();
    _homeCityTimer?.cancel();
    _genderTimer?.cancel();
    _firstController.dispose();
    _lastController.dispose();
    _phoneController.dispose();
    _homeCityController.dispose();
    _genderCustomController.dispose();
    super.dispose();
  }

  String? get _userId => ref.read(authProvider).userId;

  SupabaseClient get _client => Supabase.instance.client;

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
              'first_name, last_name, phone, gender, country, home_city, timezone, locale')
          .eq('id', userId)
          .maybeSingle();
      final session = _client.auth.currentSession;
      if (!mounted) return;
      setState(() {
        _firstController.text = (row?['first_name'] as String?) ?? '';
        _lastController.text = (row?['last_name'] as String?) ?? '';
        _phoneController.text = (row?['phone'] as String?) ??
            session?.user.phone ??
            '';
        final gender = (row?['gender'] as String?) ?? '';
        if (gender.isEmpty || _genderPresets.contains(gender)) {
          _gender = gender;
        } else {
          _gender = _genderSelfDescribe;
          _genderCustomController.text = gender;
        }
        _country = row?['country'] as String?;
        _homeCityController.text = (row?['home_city'] as String?) ?? '';
        _timezone = row?['timezone'] as String?;
        _locale = row?['locale'] as String?;
        _email = session?.user.email;
        _loading = false;
        _loadFailed = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _email = _client.auth.currentSession?.user.email;
        _loading = false;
        _loadFailed = true;
      });
    }

    await _loadTwoFactor();
  }

  Future<void> _loadTwoFactor() async {
    try {
      final factors = await _client.auth.mfa.listFactors();
      final verified = factors.totp
          .where((factor) => factor.status == FactorStatus.verified)
          .toList();
      if (!mounted) return;
      setState(() {
        _twoFactorEnabled = verified.isNotEmpty;
        _twoFactorKnown = true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _twoFactorKnown = false);
    }
  }

  void _scheduleNameSave() {
    _nameTimer?.cancel();
    _nameTimer = Timer(const Duration(milliseconds: 600), _saveName);
  }

  void _schedulePhoneSave() {
    _phoneTimer?.cancel();
    _phoneTimer = Timer(const Duration(milliseconds: 600), _savePhone);
  }

  void _scheduleGenderSave() {
    _genderTimer?.cancel();
    _genderTimer = Timer(const Duration(milliseconds: 600), _saveGender);
  }

  Future<void> _saveName() async {
    final userId = _userId;
    if (userId == null) return;
    setState(() => _nameState = _SaveState.saving);
    try {
      final first = _firstController.text.trim();
      final last = _lastController.text.trim();
      await _client.from('profiles').update({
        'first_name': first.isEmpty ? null : first,
        'last_name': last.isEmpty ? null : last,
      }).eq('id', userId);
      // Keep the top bar / drawer identity in sync with the new name.
      ref.invalidate(avatarProfileProvider);
      if (mounted) setState(() => _nameState = _SaveState.saved);
    } catch (_) {
      if (mounted) setState(() => _nameState = _SaveState.error);
    }
  }

  Future<void> _savePhone() async {
    final userId = _userId;
    if (userId == null) return;
    setState(() => _phoneState = _SaveState.saving);
    try {
      final phone = _phoneController.text.trim();
      await _client
          .from('profiles')
          .update({'phone': phone.isEmpty ? null : phone}).eq('id', userId);
      if (mounted) setState(() => _phoneState = _SaveState.saved);
    } catch (_) {
      if (mounted) setState(() => _phoneState = _SaveState.error);
    }
  }

  Future<void> _saveGender() async {
    final userId = _userId;
    if (userId == null) return;
    setState(() => _genderState = _SaveState.saving);
    try {
      final value = _gender == _genderSelfDescribe
          ? _genderCustomController.text.trim()
          : _gender;
      await _client
          .from('profiles')
          .update({'gender': value.isEmpty ? null : value}).eq('id', userId);
      if (mounted) setState(() => _genderState = _SaveState.saved);
    } catch (_) {
      if (mounted) setState(() => _genderState = _SaveState.error);
    }
  }

  void _scheduleHomeCitySave() {
    _homeCityTimer?.cancel();
    _homeCityTimer = Timer(const Duration(milliseconds: 600), _saveHomeCity);
  }

  Future<void> _saveHomeCity() async {
    final userId = _userId;
    if (userId == null) return;
    setState(() => _localeState = _SaveState.saving);
    try {
      final city = _homeCityController.text.trim();
      await _client.from('profiles').update({
        'home_city': city.isEmpty ? null : city,
      }).eq('id', userId);
      if (mounted) setState(() => _localeState = _SaveState.saved);
    } catch (_) {
      if (mounted) setState(() => _localeState = _SaveState.error);
    }
  }

  Future<void> _saveLocale({
    String? country,
    String? timezone,
    String? locale,
  }) async {
    final userId = _userId;
    if (userId == null) return;
    setState(() {
      if (country != null) _country = country.isEmpty ? null : country;
      if (timezone != null) _timezone = timezone.isEmpty ? null : timezone;
      if (locale != null) _locale = locale.isEmpty ? null : locale;
      _localeState = _SaveState.saving;
    });
    try {
      await _client.from('profiles').update({
        'country': _country,
        'timezone': _timezone,
        'locale': _locale ?? 'en',
      }).eq('id', userId);
      if (mounted) setState(() => _localeState = _SaveState.saved);
    } catch (_) {
      if (mounted) setState(() => _localeState = _SaveState.error);
    }
  }

  Future<void> _signOut() async {
    await ref.read(signOutSessionProvider)();
    if (mounted) context.go(AppRoutes.signIn);
  }

  Future<void> _createInviteCode() async {
    setState(() => _inviteLoading = true);
    try {
      final worker = ref.read(workerClientProvider);
      final result = await worker.postPersonalShareCode();
      if (!mounted) return;
      setState(() {
        _inviteCode = result['code'] as String?;
        _inviteLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _inviteLoading = false);
      _showNotYetInApp("Couldn't get an invite code. Try again in a moment.");
    }
  }

  Future<void> _copyInviteLink() async {
    if (_inviteCode == null) return;
    final link = 'https://www.purplelife.org/?invite=$_inviteCode';
    await Clipboard.setData(ClipboardData(text: link));
    setState(() => _inviteCopied = true);
    Future<void>.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) setState(() => _inviteCopied = false);
    });
  }

  void _showNotYetInApp(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 16, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Sheet header: close X at the left edge, centered title
              // (web `sheet-page.tsx` layout).
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: IconButton(
                        onPressed: () => context.go(AppRoutes.settings),
                        icon: const Icon(Icons.close_rounded, size: 20),
                        color: Colors.white.withValues(alpha: 0.6),
                        tooltip: 'Close',
                        constraints:
                            const BoxConstraints(minWidth: 44, minHeight: 44),
                      ),
                    ),
                    Text(
                      'Account',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.95),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const SettingsHubCards(current: 'account'),
              const SizedBox(height: 20),
              const _SectionLabel('Profile'),
              _SheetCard(child: _avatarCard(context)),
              const SizedBox(height: 12),
              _SheetCard(child: _profileFields(context)),
              const SizedBox(height: 20),
              const _SectionLabel('Security'),
              _SheetCard(child: _PasswordSection(client: _client)),
              const SizedBox(height: 12),
              _SheetCard(child: _twoFactorSection(context)),
              const SizedBox(height: 20),
              const _SectionLabel('Region & language'),
              _SheetCard(child: _localeSection(context)),
              const SizedBox(height: 20),
              const _SectionLabel('Appearance'),
              _SheetCard(child: _appearanceSection(context)),
              const SizedBox(height: 20),
              const _SectionLabel('Subscription'),
              const _SheetCard(
                child: _InfoBlock(
                  title: 'Your plan',
                  body:
                      'Manage your subscription in the web app at purplelife.org.',
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Invite'),
              _SheetCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _InfoBlock(
                      title: 'Get an invite code',
                      body:
                          'Share Purple with someone who could use a calmer way to track their health.',
                    ),
                    const SizedBox(height: 16),
                    if (_inviteCode == null)
                      OutlinedButton(
                        onPressed: _inviteLoading ? null : _createInviteCode,
                        child: _inviteLoading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Create my invite code'),
                      )
                    else ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.1),
                          ),
                        ),
                        child: Row(
                          children: [
                            Text(
                              _inviteCode!,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    letterSpacing: 2,
                                    color:
                                        Colors.white.withValues(alpha: 0.92),
                                  ),
                            ),
                            const Spacer(),
                            Text(
                              'Unlimited uses',
                              style: _mutedStyle(context),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _copyInviteLink,
                        icon: Icon(
                          _inviteCopied ? Icons.check : Icons.copy,
                          size: 16,
                        ),
                        label: Text(_inviteCopied ? 'Copied' : 'Copy link'),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Session'),
              _SheetCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Signed in as',
                      style: _titleStyle(context),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _email ?? 'Unknown',
                      style: _mutedStyle(context),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: _signOut,
                      child: const Text('Sign out'),
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

  Widget _avatarCard(BuildContext context) {
    // Same source as the top bar: profiles.avatar_path resolved to a signed
    // URL, with an initials fallback (web `AvatarCard`).
    final profile = ref.watch(avatarProfileProvider).valueOrNull ??
        AvatarProfile(
          firstName: _firstController.text.trim(),
          lastName: _lastController.text.trim(),
          email: _email,
        );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Profile picture', style: _titleStyle(context)),
        const SizedBox(height: 4),
        Text(
          'Used in your menu and shared with caregivers.',
          style: _mutedStyle(context),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            ProfileAvatarCircle(profile: profile, size: 64),
            const SizedBox(width: 16),
            OutlinedButton(
              onPressed: () => _showNotYetInApp(
                'Photo upload is available in the web app for now.',
              ),
              child: const Text('Upload photo'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _profileFields(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Full name', style: _titleStyle(context)),
        const SizedBox(height: 4),
        Text('How Purple addresses you.', style: _mutedStyle(context)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _firstController,
                enabled: !_loading,
                decoration: _inputDecoration('First'),
                style: _inputStyle(context),
                onChanged: (_) => _scheduleNameSave(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _lastController,
                enabled: !_loading,
                decoration: _inputDecoration('Last'),
                style: _inputStyle(context),
                onChanged: (_) => _scheduleNameSave(),
              ),
            ),
          ],
        ),
        _SavedIndicator(state: _nameState),
        _divider(),
        Text('Email', style: _titleStyle(context)),
        const SizedBox(height: 4),
        Text(_email ?? 'Unknown', style: _mutedStyle(context)),
        _divider(),
        Text('Phone number', style: _titleStyle(context)),
        const SizedBox(height: 4),
        Text(
          'Visible to people you share your account with so they can reach '
          'you. Include country code.',
          style: _mutedStyle(context),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _phoneController,
          enabled: !_loading,
          keyboardType: TextInputType.phone,
          decoration: _inputDecoration('+1 555 555 5555'),
          style: _inputStyle(context),
          onChanged: (_) => _schedulePhoneSave(),
        ),
        _SavedIndicator(state: _phoneState),
        _divider(),
        Text('Gender', style: _titleStyle(context)),
        const SizedBox(height: 4),
        Text(
          'Optional. Shown to people you share with.',
          style: _mutedStyle(context),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          key: ValueKey('gender-$_gender'),
          initialValue: _gender.isEmpty ? null : _gender,
          decoration: _inputDecoration('Select'),
          dropdownColor: const Color(0xFF1A1224),
          style: _inputStyle(context),
          items: [
            for (final preset in _genderPresets)
              DropdownMenuItem(value: preset, child: Text(preset)),
            const DropdownMenuItem(
              value: _genderSelfDescribe,
              child: Text('Self-describe'),
            ),
          ],
          onChanged: _loading
              ? null
              : (value) {
                  setState(() => _gender = value ?? '');
                  _scheduleGenderSave();
                },
        ),
        if (_gender == _genderSelfDescribe) ...[
          const SizedBox(height: 8),
          TextField(
            controller: _genderCustomController,
            decoration: _inputDecoration('Describe in your own words'),
            style: _inputStyle(context),
            onChanged: (_) => _scheduleGenderSave(),
          ),
        ],
        _SavedIndicator(state: _genderState),
        if (_loadFailed) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Profile is unavailable right now.',
                  style: _mutedStyle(context),
                ),
              ),
              TextButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ],
      ],
    );
  }

  Widget _twoFactorSection(BuildContext context) {
    final status = !_twoFactorKnown
        ? 'Status unavailable in the app right now.'
        : _twoFactorEnabled
            ? 'On. Codes are required on every sign-in.'
            : 'Not enabled.';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Two-factor authentication', style: _titleStyle(context)),
        const SizedBox(height: 4),
        Text(
          'Adds a 6-digit code from your authenticator app on every sign-in.',
          style: _mutedStyle(context),
        ),
        const SizedBox(height: 12),
        Text(status, style: _mutedStyle(context)),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: () => _showNotYetInApp(
            'Set up two-factor authentication in the web app for now.',
          ),
          child: Text(_twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'),
        ),
      ],
    );
  }

  Widget _localeSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Region & language', style: _titleStyle(context)),
        const SizedBox(height: 4),
        Text(
          'How Purple shows times and which language it speaks.',
          style: _mutedStyle(context),
        ),
        const SizedBox(height: 16),
        Text('Country', style: _mutedStyle(context)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          key: ValueKey('country-$_country'),
          initialValue: _country,
          isExpanded: true,
          decoration: _inputDecoration('Select country'),
          dropdownColor: const Color(0xFF1A1224),
          style: _inputStyle(context),
          items: [
            for (final entry in localeCountries)
              DropdownMenuItem(value: entry.key, child: Text(entry.value)),
          ],
          onChanged: _loading
              ? null
              : (value) => _saveLocale(country: value),
        ),
        const SizedBox(height: 12),
        Text('City', style: _mutedStyle(context)),
        const SizedBox(height: 8),
        TextField(
          controller: _homeCityController,
          enabled: !_loading,
          textCapitalization: TextCapitalization.words,
          decoration: _inputDecoration('e.g. Brooklyn'),
          style: _inputStyle(context),
          onChanged: (_) => _scheduleHomeCitySave(),
        ),
        const SizedBox(height: 12),
        Text('Time zone', style: _mutedStyle(context)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          key: ValueKey('timezone-$_timezone'),
          initialValue: _timezone != null && commonTimezones.contains(_timezone)
              ? _timezone
              : null,
          isExpanded: true,
          decoration: _inputDecoration('Select time zone'),
          dropdownColor: const Color(0xFF1A1224),
          style: _inputStyle(context),
          items: [
            for (final tz in commonTimezones)
              DropdownMenuItem(
                value: tz,
                child: Text(timezoneLabel(tz)),
              ),
          ],
          onChanged: _loading
              ? null
              : (value) {
                  if (value != null) _saveLocale(timezone: value);
                },
        ),
        if (_timezone != null && !commonTimezones.contains(_timezone)) ...[
          const SizedBox(height: 6),
          Text(
            'Current: ${timezoneLabel(_timezone!)}',
            style: _mutedStyle(context),
          ),
        ],
        const SizedBox(height: 12),
        Text('Language', style: _mutedStyle(context)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          key: ValueKey('locale-$_locale'),
          initialValue: _locale ?? 'en',
          decoration: _inputDecoration('Select language'),
          dropdownColor: const Color(0xFF1A1224),
          style: _inputStyle(context),
          items: [
            for (final entry in supportedLocales)
              DropdownMenuItem(value: entry.key, child: Text(entry.value)),
          ],
          onChanged: _loading
              ? null
              : (value) {
                  if (value != null) _saveLocale(locale: value);
                },
        ),
        _SavedIndicator(state: _localeState),
      ],
    );
  }

  Widget _appearanceSection(BuildContext context) {
    final mode = ref.watch(themePreferenceProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Appearance', style: _titleStyle(context)),
        const SizedBox(height: 4),
        Text(
          'Choose how Purple looks across every page.',
          style: _mutedStyle(context),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            for (var i = 0; i < PurpleThemeMode.values.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(
                child: _AppearanceTile(
                  label: themeModeLabel(PurpleThemeMode.values[i]),
                  description:
                      themeModeDescription(PurpleThemeMode.values[i]),
                  selected: mode == PurpleThemeMode.values[i],
                  onTap: () async {
                    await ref
                        .read(themePreferenceProvider.notifier)
                        .setMode(PurpleThemeMode.values[i]);
                  },
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _divider() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Divider(height: 1, color: Colors.white.withValues(alpha: 0.08)),
    );
  }
}

/// Real password change through Supabase auth (mirrors web PasswordSection).
class _PasswordSection extends StatefulWidget {
  const _PasswordSection({required this.client});

  final SupabaseClient client;

  @override
  State<_PasswordSection> createState() => _PasswordSectionState();
}

class _PasswordSectionState extends State<_PasswordSection> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _busy = false;
  String? _message;
  bool _messageIsError = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  bool get _canSave =>
      !_busy &&
      _passwordController.text.isNotEmpty &&
      _confirmController.text.isNotEmpty;

  Future<void> _save() async {
    final password = _passwordController.text;
    if (password.length < 8) {
      setState(() {
        _message = 'Minimum 8 characters.';
        _messageIsError = true;
      });
      return;
    }
    if (password != _confirmController.text) {
      setState(() {
        _message = 'Passwords do not match.';
        _messageIsError = true;
      });
      return;
    }
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await widget.client.auth.updateUser(UserAttributes(password: password));
      if (!mounted) return;
      _passwordController.clear();
      _confirmController.clear();
      setState(() {
        _busy = false;
        _message = 'Password updated.';
        _messageIsError = false;
      });
    } on AuthException catch (error) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _message = error.message;
        _messageIsError = true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _message = 'That did not work. Try again in a moment.';
        _messageIsError = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Change password', style: _titleStyle(context)),
        const SizedBox(height: 4),
        Text('Minimum 8 characters.', style: _mutedStyle(context)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: _inputDecoration('New password'),
                style: _inputStyle(context),
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _confirmController,
                obscureText: true,
                decoration: _inputDecoration('Confirm'),
                style: _inputStyle(context),
                onChanged: (_) => setState(() {}),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: _canSave ? _save : null,
          child: _busy
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Update password'),
        ),
        if (_message != null) ...[
          const SizedBox(height: 8),
          Text(
            _message!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: _messageIsError
                      ? Theme.of(context).colorScheme.error
                      : const Color(0xFF6EE7B7),
                ),
          ),
        ],
      ],
    );
  }
}

class _InfoBlock extends StatelessWidget {
  const _InfoBlock({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: _titleStyle(context)),
        const SizedBox(height: 4),
        Text(body, style: _mutedStyle(context)),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        label.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              // Web sheet section labels: 11px, tracking 0.18em.
              fontSize: 11,
              letterSpacing: 11 * 0.18,
              color: Colors.white.withValues(alpha: 0.45),
            ),
      ),
    );
  }
}

class _SheetCard extends StatelessWidget {
  const _SheetCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(20),
      // Web sheet cards use radius.sheetCard (28) from design tokens.
      borderRadius: PurpleTokens.loaded.radius.sheetCard,
      child: child,
    );
  }
}

class _SavedIndicator extends StatelessWidget {
  const _SavedIndicator({required this.state});

  final _SaveState state;

  @override
  Widget build(BuildContext context) {
    if (state == _SaveState.idle) return const SizedBox(height: 18);
    final style = Theme.of(context).textTheme.bodySmall?.copyWith(
          color: state == _SaveState.error
              ? Theme.of(context).colorScheme.error
              : Colors.white.withValues(alpha: 0.5),
        );
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          if (state == _SaveState.saving) ...[
            SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(width: 6),
            Text('Saving', style: style),
          ],
          if (state == _SaveState.saved) ...[
            const Icon(Icons.check, size: 12, color: Color(0xFF6EE7B7)),
            const SizedBox(width: 6),
            Text('Saved', style: style),
          ],
          if (state == _SaveState.error)
            Text('Could not save, try again', style: style),
        ],
      ),
    );
  }
}

class _AppearanceTile extends StatelessWidget {
  const _AppearanceTile({
    required this.label,
    required this.description,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String description;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          constraints: const BoxConstraints(minHeight: 64),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: Colors.white.withValues(alpha: 0.04),
            border: Border.all(
              color: selected
                  ? primary.withValues(alpha: 0.5)
                  : Colors.white.withValues(alpha: 0.1),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.92),
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

TextStyle? _titleStyle(BuildContext context) {
  return Theme.of(context).textTheme.bodyLarge?.copyWith(
        color: Colors.white.withValues(alpha: 0.92),
      );
}

TextStyle? _mutedStyle(BuildContext context) {
  return Theme.of(context).textTheme.bodySmall?.copyWith(
        color: Colors.white.withValues(alpha: 0.55),
        height: 1.4,
      );
}

TextStyle _inputStyle(BuildContext context) {
  return TextStyle(
    fontSize: 15,
    color: Colors.white.withValues(alpha: 0.92),
  );
}

InputDecoration _inputDecoration(String hint) {
  return InputDecoration(
    hintText: hint,
    hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
    filled: true,
    fillColor: Colors.white.withValues(alpha: 0.04),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.25)),
    ),
    disabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
    ),
  );
}
