import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/providers/core_providers.dart';

/// Triggers [GoRouter.refresh] when auth/session changes without recreating
/// the router (recreating drops deep links like `#/account`).
class RouterRefreshNotifier extends ChangeNotifier {
  RouterRefreshNotifier(this._ref) {
    _ref.listen<AsyncValue<dynamic>>(authRepositoryProvider, (_, __) {
      notifyListeners();
    });
    _ref.listen(authSessionProvider, (_, __) {
      notifyListeners();
    });
  }

  final Ref _ref;
}

final routerRefreshProvider = Provider<RouterRefreshNotifier>((ref) {
  final notifier = RouterRefreshNotifier(ref);
  ref.onDispose(notifier.dispose);
  return notifier;
});
