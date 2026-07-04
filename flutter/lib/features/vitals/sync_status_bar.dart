import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Wearable sync status bar ported from `src/components/biometrics/sync-status.tsx`.
class SyncStatusBar extends ConsumerStatefulWidget {
  const SyncStatusBar({
    super.key,
    this.variant = SyncStatusVariant.detailed,
    this.onSynced,
    this.refreshSignal = 0,
  });

  final SyncStatusVariant variant;
  final VoidCallback? onSynced;
  final int refreshSignal;

  @override
  ConsumerState<SyncStatusBar> createState() => _SyncStatusBarState();
}

enum SyncStatusVariant { compact, detailed }

class _SyncStatusBarState extends ConsumerState<SyncStatusBar> {
  static const _wearableSources = ['oura', 'whoop', 'apple_health', 'health_connect'];
  static const _pullProviders = [
    _PullProvider(id: 'oura', tokensTable: 'oura_tokens', label: 'Oura'),
    _PullProvider(id: 'whoop', tokensTable: 'whoop_tokens', label: 'Whoop'),
  ];

  bool _loaded = false;
  bool _busy = false;
  Map<String, bool> _connected = {};
  bool _appleConnected = false;
  String? _dataThrough;
  String? _lastPulledIso;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  @override
  void didUpdateWidget(covariant SyncStatusBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.refreshSignal != widget.refreshSignal) {
      _refresh();
    }
  }

  Future<void> _refresh() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      setState(() => _loaded = true);
      return;
    }
    final uid = session.user.id;
    final client = Supabase.instance.client;

    final tokenRows = await Future.wait(
      _pullProviders.map((provider) async {
        final row = await client
            .from(provider.tokensTable)
            .select('updated_at, last_sync_at')
            .eq('user_id', uid)
            .maybeSingle();
        return _TokenRow(id: provider.id, row: row);
      }),
    );

    final bio = await client
        .from('biometrics')
        .select('recorded_at')
        .eq('user_id', uid)
        .inFilter('source', _wearableSources)
        .order('recorded_at', ascending: false)
        .limit(1)
        .maybeSingle();

    final apple = await client
        .from('apple_health_tokens')
        .select('last_sync_at, last_webhook_at, updated_at')
        .eq('user_id', uid)
        .maybeSingle();

    final connected = <String, bool>{};
    final stamps = <int>[];
    for (final entry in tokenRows) {
      connected[entry.id] = entry.row != null;
      final ts = _pickTimestamp(
        entry.row?['last_sync_at'] as String?,
        entry.row?['updated_at'] as String?,
      );
      if (ts != null) stamps.add(ts.millisecondsSinceEpoch);
    }

    final appleConnected = apple != null;
    final appleTs = _pickTimestamp(
      apple?['last_sync_at'] as String?,
      apple?['last_webhook_at'] as String?,
      apple?['updated_at'] as String?,
    );
    if (appleTs != null) stamps.add(appleTs.millisecondsSinceEpoch);

    final latest = stamps.isEmpty ? null : DateTime.fromMillisecondsSinceEpoch(stamps.reduce((a, b) => a > b ? a : b));

    if (!mounted) return;
    setState(() {
      _connected = connected;
      _appleConnected = appleConnected;
      _dataThrough = bio?['recorded_at'] as String?;
      _lastPulledIso = latest?.toUtc().toIso8601String();
      _loaded = true;
    });
  }

  DateTime? _pickTimestamp(String? primary, [String? secondary, String? tertiary]) {
    for (final value in [primary, secondary, tertiary]) {
      if (value == null) continue;
      final parsed = DateTime.tryParse(value);
      if (parsed != null) return parsed;
    }
    return null;
  }

  bool get _anyPullConnected => _pullProviders.any((p) => _connected[p.id] == true);

  Future<void> _syncNow() async {
    if (_busy) return;
    final active = _pullProviders.where((p) => _connected[p.id] == true).toList();
    if (active.isEmpty) return;

    setState(() => _busy = true);
    try {
      await Future.wait(
        active.map((provider) async {
          if (provider.id == 'oura') {
            await Supabase.instance.client.functions.invoke(
              'oura-sync',
              body: const {'action': 'incremental'},
            );
          }
          // Whoop sync runs on Worker in web; native Flutter can call Worker later.
        }),
      );
      await _refresh();
      widget.onSynced?.call();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) return const SizedBox.shrink();
    if (!_anyPullConnected && !_appleConnected) return const SizedBox.shrink();

    final pulledDate = _lastPulledIso == null ? null : DateTime.tryParse(_lastPulledIso!);
    final dataThroughLabel =
        _dataThrough == null ? null : formatDataThrough(_dataThrough!);
    final showButton = _anyPullConnected;

    if (widget.variant == SyncStatusVariant.compact) {
      return Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pulledDate == null
                      ? 'Never synced'
                      : 'Last sync ${formatRelativeTime(pulledDate)}',
                  style: _labelStyle(context),
                ),
                if (dataThroughLabel != null)
                  Text(
                    'Data through $dataThroughLabel',
                    style: _labelStyle(context, opacity: 0.7),
                  ),
              ],
            ),
          ),
          if (showButton)
            IconButton(
              onPressed: _busy ? null : _syncNow,
              icon: _busy
                  ? SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white.withValues(alpha: 0.7),
                      ),
                    )
                  : Icon(Icons.refresh, size: 16, color: Colors.white.withValues(alpha: 0.65)),
              tooltip: 'Sync wearables now',
            ),
        ],
      );
    }

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text.rich(
                TextSpan(
                  text: 'Data through ',
                  style: _labelStyle(context),
                  children: [
                    TextSpan(
                      text: dataThroughLabel ?? '–',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
                    ),
                  ],
                ),
              ),
              Text.rich(
                TextSpan(
                  text: 'Last pulled ',
                  style: _labelStyle(context),
                  children: [
                    TextSpan(
                      text: pulledDate == null ? 'never' : formatRelativeTime(pulledDate),
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (showButton)
          OutlinedButton.icon(
            onPressed: _busy ? null : _syncNow,
            icon: _busy
                ? SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white.withValues(alpha: 0.7),
                    ),
                  )
                : Icon(Icons.refresh, size: 16, color: Colors.white.withValues(alpha: 0.8)),
            label: Text(_busy ? 'Syncing' : 'Sync now'),
          ),
      ],
    );
  }

  TextStyle? _labelStyle(BuildContext context, {double opacity = 1}) {
    return Theme.of(context).textTheme.labelSmall?.copyWith(
          fontSize: 11,
          color: Colors.white.withValues(alpha: 0.55 * opacity),
        );
  }
}

class _PullProvider {
  const _PullProvider({
    required this.id,
    required this.tokensTable,
    required this.label,
  });

  final String id;
  final String tokensTable;
  final String label;
}

class _TokenRow {
  const _TokenRow({required this.id, required this.row});

  final String id;
  final Map<String, dynamic>? row;
}

/// Wearable daily rows use UTC midnight or noon for a YYYY-MM-DD day key.
bool isDailyBucketTimestamp(String iso) {
  return RegExp(r'T(00|12):00:00(\.000)?Z$').hasMatch(iso);
}

/// Latest biometrics.recorded_at for "Data through".
String formatDataThrough(String iso) {
  final parsed = DateTime.tryParse(iso);
  if (parsed == null) return '–';
  if (isDailyBucketTimestamp(iso)) {
    final parts = iso.substring(0, 10).split('-');
    if (parts.length != 3) return '–';
    final localDay = DateTime(
      int.parse(parts[0]),
      int.parse(parts[1]),
      int.parse(parts[2]),
    );
    return DateFormat('EEE MMM d').format(localDay);
  }
  return DateFormat('EEE h:mm a').format(parsed.toLocal());
}

String formatRelativeTime(DateTime date) {
  final diff = DateTime.now().difference(date);
  if (diff.inSeconds < 60) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return DateFormat.MMMd().format(date);
}
