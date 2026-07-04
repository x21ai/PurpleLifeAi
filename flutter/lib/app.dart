import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/providers/core_providers.dart';
import 'design/purple_theme.dart';
import 'design/tokens.dart';
import 'shell/router.dart';

/// Root widget: theme, router, and core service bootstrap.
class PurpleApp extends ConsumerWidget {
  const PurpleApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(authRepositoryProvider);
    ref.watch(connectivityServiceProvider);

    final router = ref.watch(routerProvider);
    final tokens = PurpleTokens.loaded;
    final theme = buildPurpleDarkTheme(tokens: tokens);

    return MaterialApp.router(
      title: 'Purple',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      theme: theme,
      darkTheme: theme,
      routerConfig: router,
      builder: (context, child) {
        final mq = MediaQuery.of(context);
        return MediaQuery(
          data: mq.copyWith(platformBrightness: Brightness.dark),
          child: ColoredBox(
            color: purpleCanvasDark,
            child: child ?? const SizedBox.shrink(),
          ),
        );
      },
    );
  }
}
