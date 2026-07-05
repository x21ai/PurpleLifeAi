import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers/core_providers.dart';
import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../health/apple_health_panel.dart';
import '../shared/glass_helpers.dart';
import '../vitals/vitals_repository.dart';
import 'sync_mode_select.dart';
import 'wearable_oauth.dart';

/// Tools and device connections ported from web `src/routes/_app/tools.tsx`.
///
/// Oura and Whoop connection state is read from their token tables (same
/// source as the web connection cards). Apple Health embeds the native
/// HealthKit / Health Connect panel.
class ToolsScreen extends ConsumerStatefulWidget {
  const ToolsScreen({super.key});

  @override
  ConsumerState<ToolsScreen> createState() => _ToolsScreenState();
}

class _ProviderState {
  const _ProviderState({required this.connected, this.lastSync});

  final bool connected;
  final String? lastSync;
}

String _relativeTime(String? iso) {
  if (iso == null) return 'never';
  final parsed = DateTime.tryParse(iso);
  if (parsed == null) return 'never';
  final minutes = DateTime.now().difference(parsed).inMinutes;
  if (minutes < 1) return 'just now';
  if (minutes < 60) return '$minutes min ago';
  final hours = (minutes / 60).round();
  if (hours < 24) return '${hours}h ago';
  return '${(hours / 24).round()}d ago';
}

String _coverageSummary(WearableCoverage coverage) {
  const labels = {
    'oura': 'Oura',
    'whoop': 'Whoop',
    'apple_health': 'Apple Health',
    'health_connect': 'Health Connect',
  };
  final parts = coverage.daysBySource.entries
      .where((e) => e.value > 0)
      .map((e) => '${labels[e.key] ?? e.key} ${e.value}d')
      .toList();
  if (parts.isEmpty) return 'none in last 90 days';
  return '${parts.join(' · ')} in last 90 days';
}

class _ToolsScreenState extends ConsumerState<ToolsScreen> {
  final _ouraKey = GlobalKey();
  final _whoopKey = GlobalKey();
  final _appleHealthKey = GlobalKey();

  bool _loaded = false;
  bool _loadFailed = false;
  _ProviderState _oura = const _ProviderState(connected: false);
  _ProviderState _whoop = const _ProviderState(connected: false);
  bool _ouraBusy = false;
  bool _whoopBusy = false;
  String? _ouraError;
  String? _whoopError;
  StreamSubscription<WearableOAuthProvider>? _oauthSub;
  StreamSubscription<WearableOAuthFailure>? _oauthErrorSub;
  bool _ouraBackfilling = false;

  SupabaseClient get _client => Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _refresh();
    _oauthSub = wearableOAuthConnectedController.stream.listen((provider) {
      if (!mounted) return;
      setState(() {
        if (provider == WearableOAuthProvider.oura) {
          _ouraError = null;
          _ouraBackfilling = true;
        } else {
          _whoopError = null;
        }
      });
      if (provider == WearableOAuthProvider.oura) {
        _pollOuraBackfill();
      }
      unawaited(_refresh());
    });
    _oauthErrorSub = wearableOAuthErrorController.stream.listen((failure) {
      if (!mounted) return;
      setState(() {
        if (failure.provider == WearableOAuthProvider.oura) {
          _ouraError = failure.message;
          _ouraBackfilling = false;
        } else {
          _whoopError = failure.message;
        }
      });
    });
  }

  @override
  void dispose() {
    unawaited(_oauthSub?.cancel());
    unawaited(_oauthErrorSub?.cancel());
    super.dispose();
  }

  void _pollOuraBackfill() {
    var polls = 0;
    Timer.periodic(const Duration(seconds: 2), (timer) {
      polls++;
      if (!mounted || polls >= 15) {
        timer.cancel();
        if (mounted) setState(() => _ouraBackfilling = false);
        return;
      }
      unawaited(_refresh());
    });
  }

  Future<void> _refresh() async {
    final session = _client.auth.currentSession;
    if (session == null) {
      if (mounted) setState(() => _loaded = true);
      return;
    }
    final uid = session.user.id;

    try {
      final rows = await Future.wait([
        _client
            .from('oura_tokens')
            .select('updated_at, last_sync_at')
            .eq('user_id', uid)
            .maybeSingle(),
        _client
            .from('whoop_tokens')
            .select('updated_at, last_sync_at')
            .eq('user_id', uid)
            .maybeSingle(),
      ]);
      if (!mounted) return;
      setState(() {
        _oura = _stateFromRow(rows[0]);
        _whoop = _stateFromRow(rows[1]);
        _loaded = true;
        _loadFailed = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loaded = true;
        _loadFailed = true;
      });
    }
  }

  _ProviderState _stateFromRow(Map<String, dynamic>? row) {
    if (row == null) return const _ProviderState(connected: false);
    return _ProviderState(
      connected: true,
      lastSync:
          (row['last_sync_at'] as String?) ?? (row['updated_at'] as String?),
    );
  }

  Future<void> _syncOura() async {
    setState(() => _ouraBusy = true);
    try {
      final response = await _client.functions.invoke(
        'oura-sync',
        body: const {'action': 'incremental'},
      );
      if (response.status != 200) {
        throw StateError(
          ouraFunctionErrorMessage(response.data, statusCode: response.status),
        );
      }
      final data = response.data;
      if (data is Map && data['error'] != null) {
        throw StateError(ouraFunctionErrorMessage(data));
      }
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Synced')));
      }
      await _refresh();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              error is StateError
                  ? error.message
                  : 'The sync did not finish. Purple will try again next time, or you can retry now.',
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _ouraBusy = false);
    }
  }

  Future<void> _disconnect(String table, String label) async {
    final session = _client.auth.currentSession;
    if (session == null) return;
    try {
      await _client.from(table).delete().eq('user_id', session.user.id);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$label disconnected')));
      }
      await _refresh();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not disconnect $label. Try again.')),
        );
      }
    }
  }

  Future<void> _syncWhoop() async {
    setState(() => _whoopBusy = true);
    try {
      final worker = ref.read(workerClientProvider);
      final result = await worker.postWhoopIncrementalSync();
      if (result['ok'] == false &&
          result['reason'] == 'reconnect_required' &&
          mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['message'] as String? ??
                  'Whoop session expired. Disconnect and connect again.',
            ),
          ),
        );
        return;
      }
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Synced')));
      }
      await _refresh();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'The sync did not finish. Purple will try again next time, or you can retry now.',
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _whoopBusy = false);
    }
  }

  Future<void> _connectWearable(WearableOAuthProvider provider) async {
    final label = provider == WearableOAuthProvider.oura ? 'Oura' : 'Whoop';
    setState(() {
      if (provider == WearableOAuthProvider.oura) {
        _ouraError = null;
      } else {
        _whoopError = null;
      }
    });
    try {
      await ref.read(wearableOAuthServiceProvider).connect(provider);
    } catch (error) {
      if (!mounted) return;
      final message = error is StateError
          ? error.message
          : "Couldn't start $label sign-in. Try again.";
      setState(() {
        if (provider == WearableOAuthProvider.oura) {
          _ouraError = message;
        } else {
          _whoopError = message;
        }
      });
    }
  }

  void _scrollToCard(GlobalKey key) {
    Navigator.of(context).pop();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final targetContext = key.currentContext;
      if (targetContext == null) return;
      Scrollable.ensureVisible(
        targetContext,
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final coverage =
        ref.watch(wearableCoverageProvider).valueOrNull ?? WearableCoverage.empty;

    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 16, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  'Tools',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
              ),
              const SizedBox(height: 12),
              if (coverage.daysBySource.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: GlassSurface(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Synced biometrics: ${_coverageSummary(coverage)}',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.65),
                                  height: 1.35,
                                ),
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go(AppRoutes.myHealth),
                          child: const Text('My Body'),
                        ),
                      ],
                    ),
                  ),
                ),
              if (_loadFailed) ...[
                GlassSurface(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Connection status is unavailable right now.',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(
                                color: Colors.white.withValues(alpha: 0.55),
                              ),
                        ),
                      ),
                      TextButton(
                        onPressed: _refresh,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
              _ConnectionCard(
                key: _ouraKey,
                icon: Icons.watch_outlined,
                title: 'Oura Ring',
                provider: WearableOAuthProvider.oura,
                state: _oura,
                loaded: _loaded && !_loadFailed,
                disconnectedSubtitle: 'Sleep, readiness, HRV, temperature',
                busy: _ouraBusy || _ouraBackfilling,
                backfilling: _ouraBackfilling,
                errorMessage: _ouraError,
                tokensTable: 'oura_tokens',
                coverageDays: coverage.daysForSource('oura'),
                onConnect: () => _connectWearable(WearableOAuthProvider.oura),
                onSync: _syncOura,
                onDisconnect: () => _disconnect('oura_tokens', 'Oura'),
              ),
              const SizedBox(height: 12),
              _ConnectionCard(
                key: _whoopKey,
                icon: Icons.favorite_outline,
                title: 'Whoop',
                provider: WearableOAuthProvider.whoop,
                state: _whoop,
                loaded: _loaded && !_loadFailed,
                disconnectedSubtitle: 'Recovery, strain, sleep, HRV',
                busy: _whoopBusy,
                errorMessage: _whoopError,
                tokensTable: 'whoop_tokens',
                coverageDays: coverage.daysForSource('whoop'),
                onConnect: () => _connectWearable(WearableOAuthProvider.whoop),
                onSync: _syncWhoop,
                onDisconnect: () => _disconnect('whoop_tokens', 'Whoop'),
              ),
              const SizedBox(height: 12),
              GlassSurface(
                key: _appleHealthKey,
                padding: const EdgeInsets.all(20),
                child: const AppleHealthPanel(embedded: true),
              ),
              const SizedBox(height: 12),
              GlassCard(
                onTap: _showDevicePicker,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                child: Row(
                  children: [
                    Icon(Icons.add, color: Colors.white.withValues(alpha: 0.85)),
                    const SizedBox(width: 12),
                    Text(
                      'Set up a new device',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const _SectionLabel('Notifications'),
              GlassSurface(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Medication reminders',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.92),
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Dose reminders, snooze length, and quiet hours live in '
                      'Settings. Push alerts on this device ship in a later update.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                            height: 1.4,
                          ),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => context.go(AppRoutes.settings),
                      style: TextButton.styleFrom(
                        minimumSize: const Size(88, 44),
                        foregroundColor: Colors.white.withValues(alpha: 0.85),
                      ),
                      child: const Text('Open Settings'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Tools & utilities'),
              GlassSurface(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _ToolRow(
                      icon: Icons.medication_outlined,
                      title: 'Medications',
                      subtitle: 'Schedules, reminders, adherence',
                      onTap: () => context.go(AppRoutes.meds),
                    ),
                    _rowDivider(),
                    _ToolRow(
                      icon: Icons.description_outlined,
                      title: 'Lab reports',
                      subtitle: 'Upload PDFs or photos. See trends.',
                      onTap: () => context.go(AppRoutes.settingsReports),
                    ),
                    _rowDivider(),
                    _ToolRow(
                      icon: Icons.flight_outlined,
                      title: 'Travel mode',
                      subtitle: 'Plan trips, anchor doses to home time',
                      onTap: () => context.go(AppRoutes.settingsTravel),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Wear and care'),
              GlassSurface(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _InternalRow(
                      title: 'How Purple thinks',
                      onTap: () => context.go(AppRoutes.settingsHowPurpleThinks),
                    ),
                    _rowDivider(),
                    _InternalRow(
                      title: 'Privacy & data',
                      onTap: () => context.go(AppRoutes.settingsPrivacy),
                    ),
                    _rowDivider(),
                    _InternalRow(
                      title: 'About Purple',
                      onTap: () => _showWebOnly('About Purple'),
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

  void _showWebOnly(String label) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label is available at purplelife.org for now.'),
      ),
    );
  }

  Widget _rowDivider() {
    return Divider(height: 1, color: Colors.white.withValues(alpha: 0.08));
  }

  Future<void> _showDevicePicker() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF1A1224),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Set up a new device',
                  style: Theme.of(sheetContext).textTheme.titleLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Choose a device or app to connect. Purple supports these today.',
                  style: Theme.of(sheetContext).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
                const SizedBox(height: 16),
                _PickerRow(
                  icon: Icons.watch_outlined,
                  title: 'Oura Ring',
                  subtitle: 'Sleep, readiness, HRV',
                  onTap: () => _scrollToCard(_ouraKey),
                ),
                const SizedBox(height: 8),
                _PickerRow(
                  icon: Icons.favorite_outline,
                  title: 'Whoop',
                  subtitle: 'Recovery, strain, sleep',
                  onTap: () => _scrollToCard(_whoopKey),
                ),
                const SizedBox(height: 8),
                _PickerRow(
                  icon: Icons.health_and_safety_outlined,
                  title: 'Apple Health',
                  subtitle: 'Steps, heart rate, workouts',
                  onTap: () => _scrollToCard(_appleHealthKey),
                ),
                const SizedBox(height: 12),
                Text(
                  'More devices are on the way. Email hello@purplelife.org to request one.',
                  style: Theme.of(sheetContext).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Oura/Whoop connection card mirroring the web connection components.
class _ConnectionCard extends StatelessWidget {
  const _ConnectionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.provider,
    required this.state,
    required this.loaded,
    required this.disconnectedSubtitle,
    required this.busy,
    required this.tokensTable,
    this.coverageDays,
    required this.onConnect,
    required this.onSync,
    required this.onDisconnect,
    this.backfilling = false,
    this.errorMessage,
  });

  final IconData icon;
  final String title;
  final WearableOAuthProvider provider;
  final _ProviderState state;
  final bool loaded;
  final String disconnectedSubtitle;
  final bool busy;
  final bool backfilling;
  final String? errorMessage;
  final String tokensTable;
  final int? coverageDays;
  final VoidCallback onConnect;
  final Future<void> Function()? onSync;
  final VoidCallback onDisconnect;

  @override
  Widget build(BuildContext context) {
    final connected = loaded && state.connected;
    final setupHint = WearableOAuth.nativeConnectSetupHint(provider);
    final statusText = !loaded
        ? 'Checking status'
        : connected
            ? backfilling
                ? 'Importing your last 90 days…'
                : 'Connected · Last synced ${_relativeTime(state.lastSync)}'
            : disconnectedSubtitle;

    return GlassSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.08),
                ),
                child: Icon(
                  icon,
                  size: 18,
                  color: Colors.white.withValues(alpha: 0.85),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontFamily: PurpleType.serif,
                            color: Colors.white.withValues(alpha: 0.92),
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      statusText,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                    ),
                  ],
                ),
              ),
              if (loaded && !connected)
                FilledButton(
                  onPressed: onConnect,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(88, 44),
                    shape: const StadiumBorder(),
                  ),
                  child: const Text('Connect'),
                ),
            ],
          ),
          if (connected &&
              !backfilling &&
              coverageDays != null &&
              coverageDays! > 0) ...[
            const SizedBox(height: 8),
            Text(
              '$coverageDays day${coverageDays == 1 ? '' : 's'} of readings in last 90 days',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
            ),
          ],
          if (errorMessage != null && errorMessage!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              errorMessage!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFFFF8A80),
                    height: 1.35,
                  ),
            ),
          ] else if (!connected && loaded && setupHint != null) ...[
            const SizedBox(height: 10),
            Text(
              setupHint,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.5),
                    height: 1.35,
                  ),
            ),
          ],
          if (connected) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                if (onSync != null)
                  OutlinedButton(
                    onPressed: busy ? null : () => onSync!(),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(72, 44),
                    ),
                    child: busy
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Sync'),
                  ),
                if (onSync != null) const SizedBox(width: 8),
                TextButton(
                  onPressed: onDisconnect,
                  style: TextButton.styleFrom(
                    minimumSize: const Size(88, 44),
                    foregroundColor: Colors.white.withValues(alpha: 0.7),
                  ),
                  child: const Text('Disconnect'),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  'Auto-sync',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(width: 8),
                SyncModeSelect(table: tokensTable),
              ],
            ),
          ],
        ],
      ),
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
              letterSpacing: 1.8,
              color: Colors.white.withValues(alpha: 0.45),
            ),
      ),
    );
  }
}

class _ToolRow extends StatelessWidget {
  const _ToolRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 60),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.08),
                ),
                child: Icon(
                  icon,
                  size: 18,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 18,
                color: Colors.white.withValues(alpha: 0.4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InternalRow extends StatelessWidget {
  const _InternalRow({required this.title, required this.onTap});

  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 52),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 18,
                color: Colors.white.withValues(alpha: 0.4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PickerRow extends StatelessWidget {
  const _PickerRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      borderRadius: 16,
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child:
                Icon(icon, size: 18, color: Colors.white.withValues(alpha: 0.85)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                ),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.4)),
        ],
      ),
    );
  }
}
