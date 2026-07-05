import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/core_providers.dart';
import 'health_providers.dart';
import 'health_service.dart';
import 'native_health_autosync.dart';

/// Defers native HealthKit sync shortly after auth bootstrap (web
/// `DeferredStartup` + visit-mode wearable pattern).
class NativeHealthStartupListener extends ConsumerStatefulWidget {
  const NativeHealthStartupListener({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<NativeHealthStartupListener> createState() =>
      _NativeHealthStartupListenerState();
}

class _NativeHealthStartupListenerState
    extends ConsumerState<NativeHealthStartupListener>
    with WidgetsBindingObserver {
  Timer? _startupTimer;
  bool _ranStartup = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _scheduleStartupSync();
  }

  @override
  void dispose() {
    _startupTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(_runVisitSync(force: false));
    }
  }

  void _scheduleStartupSync() {
    _startupTimer?.cancel();
    _startupTimer = Timer(const Duration(seconds: 2), () {
      if (!mounted || _ranStartup) return;
      _ranStartup = true;
      unawaited(_runVisitSync(force: false));
    });
  }

  Future<void> _runVisitSync({required bool force}) async {
    if (!isNativeHealthPlatform) return;

    final health = ref.read(healthServiceProvider);
    final sync = buildNativeHealthSync(
      workerClient: ref.read(workerClientProvider),
      syncService: ref.read(syncServiceProvider),
    );

    await syncNativeHealthIfAuthorized(
      healthService: health,
      syncClient: sync,
      supabase: ref.read(supabaseClientProvider),
      force: force,
    );
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
