import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Sync-mode picker for pull-based wearables (mirrors web `SyncModeSelect`).
class SyncModeSelect extends StatefulWidget {
  const SyncModeSelect({
    super.key,
    required this.table,
  });

  final String table;

  @override
  State<SyncModeSelect> createState() => _SyncModeSelectState();
}

class _SyncModeSelectState extends State<SyncModeSelect> {
  static const _options = <String, String>{
    'visit': 'When I open Purple (every 3h)',
    'pull': 'Pull to refresh',
    '1': 'Every hour',
    '6': 'Every 6 hours',
    '12': 'Every 12 hours',
    'manual': 'Manual only',
  };

  String _value = 'visit';
  bool _loaded = false;

  SupabaseClient get _client => Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final session = _client.auth.currentSession;
    if (session == null) return;
    try {
      final row = await _client
          .from(widget.table)
          .select('sync_mode, sync_interval_hours')
          .eq('user_id', session.user.id)
          .maybeSingle();
      if (!mounted || row == null) return;
      final mode = row['sync_mode'] as String? ?? 'visit';
      final hours = row['sync_interval_hours'];
      final resolved = mode == 'interval' ? '${hours ?? 12}' : mode;
      setState(() {
        _value = _options.containsKey(resolved) ? resolved : 'visit';
        _loaded = true;
      });
    } catch (_) {
      if (mounted) setState(() => _loaded = true);
    }
  }

  Future<void> _onChanged(String? next) async {
    if (next == null || next == _value) return;
    final previous = _value;
    setState(() => _value = next);

    final isInterval = next == '1' || next == '6' || next == '12';
    final mode = isInterval ? 'interval' : next;
    final hours = isInterval ? int.parse(next) : 0;

    final session = _client.auth.currentSession;
    if (session == null) return;

    try {
      await _client.from(widget.table).update({
        'sync_mode': mode,
        'sync_interval_hours': hours,
      }).eq('user_id', session.user.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_options[next] ?? 'Sync preference saved')),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _value = previous);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save preference')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) {
      return const SizedBox(
        width: 190,
        height: 36,
        child: Center(
          child: SizedBox(
            width: 14,
            height: 14,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    return SizedBox(
      width: 190,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: _value,
            isExpanded: true,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            dropdownColor: const Color(0xFF1A1224),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.85),
                ),
            items: _options.entries
                .map(
                  (entry) => DropdownMenuItem(
                    value: entry.key,
                    child: Text(entry.value),
                  ),
                )
                .toList(),
            onChanged: _onChanged,
          ),
        ),
      ),
    );
  }
}
