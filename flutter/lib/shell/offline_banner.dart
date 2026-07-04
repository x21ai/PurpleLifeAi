import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/providers/core_providers.dart';
import '../design/purple_theme.dart';

/// Subtle offline strip below the status bar when connectivity is lost.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final onlineAsync = ref.watch(isOnlineProvider);
    final isOnline = onlineAsync.maybeWhen(
      data: (value) => value,
      orElse: () => true,
    );

    if (isOnline) {
      return const SizedBox.shrink();
    }

    return Material(
      color: PurpleColors.backgroundTertiary,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.wifi_off_rounded,
                size: 16,
                color: PurpleColors.foregroundTertiary,
              ),
              const SizedBox(width: 8),
              Text(
                'Offline',
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
