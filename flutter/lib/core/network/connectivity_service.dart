import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

/// Online/offline state with optimistic reachability checks (NativeConnectivityGate pattern).
class ConnectivityService {
  ConnectivityService({
    required AppConfig config,
    Connectivity? connectivity,
    http.Client? httpClient,
  })  : _config = config,
        _connectivity = connectivity ?? Connectivity(),
        _httpClient = httpClient ?? http.Client();

  final AppConfig _config;
  final Connectivity _connectivity;
  final http.Client _httpClient;

  final StreamController<bool> _onlineController =
      StreamController<bool>.broadcast();

  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  bool _lastOnline = true;
  bool _disposed = false;

  /// Broadcast stream: true when device has network and Purple site responds.
  Stream<bool> get onlineStream => _onlineController.stream;

  bool get isOnline => _lastOnline;

  Future<void> start() async {
    final initial = await _evaluateOnline(strict: false);
    _emit(initial);

    _connectivitySub = _connectivity.onConnectivityChanged.listen((results) async {
      if (_disposed) return;
      if (_isDisconnected(results)) {
        _emit(false);
        return;
      }
      final online = await _evaluateOnline(strict: false);
      _emit(online);
    });
  }

  /// Manual retry (strict mode shows offline until ping succeeds).
  Future<bool> retry({bool strict = true}) async {
    final online = await _evaluateOnline(strict: strict);
    _emit(online);
    return online;
  }

  void dispose() {
    _disposed = true;
    _connectivitySub?.cancel();
    _httpClient.close();
    _onlineController.close();
  }

  void _emit(bool online) {
    _lastOnline = online;
    if (!_onlineController.isClosed) {
      _onlineController.add(online);
    }
  }

  bool _isDisconnected(List<ConnectivityResult> results) {
    if (results.isEmpty) return true;
    return results.every((r) => r == ConnectivityResult.none);
  }

  Future<bool> _evaluateOnline({required bool strict}) async {
    final results = await _connectivity.checkConnectivity();
    if (_isDisconnected(results)) return false;

    if (await _ping(method: 'HEAD')) return true;
    if (await _ping(method: 'GET')) return true;
    return !strict && _lastOnline;
  }

  Future<bool> _ping({required String method}) async {
    final uri = Uri.parse(_config.siteUrl);
    try {
      final response = await _httpClient
          .send(
            http.Request(method, uri)
              ..headers['cache-control'] = 'no-store',
          )
          .timeout(_config.connectivityPingTimeout);
      await response.stream.drain<void>();
      return response.statusCode == 200 || response.statusCode == 405;
    } catch (e, st) {
      debugPrint('[ConnectivityService] ping failed: $e\n$st');
      return false;
    }
  }
}
