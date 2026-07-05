import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/providers/core_providers.dart';
import 'design/purple_theme.dart';
import 'design/tokens.dart';
import 'features/account/theme_preference.dart';
import 'features/tools/wearable_oauth.dart';
import 'shell/router.dart';

/// Root widget: theme, router, and core service bootstrap.
class PurpleApp extends ConsumerWidget {
  const PurpleApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authInit = ref.watch(authRepositoryProvider);
    ref.watch(connectivityServiceProvider);

    final router = ref.watch(routerProvider);
    final tokens = PurpleTokens.loaded;
    final lightTheme = buildPurpleLightTheme(tokens: tokens);
    final darkTheme = buildPurpleDarkTheme(tokens: tokens);
    final appearance = ref.watch(themePreferenceProvider);
    final brightness = resolveThemeBrightness(appearance);
    final canvasColor = brightness == Brightness.light
        ? lightTheme.scaffoldBackgroundColor
        : purpleCanvasDark;

    return MaterialApp.router(
      title: 'Purple',
      debugShowCheckedModeBanner: false,
      themeMode: appearance == PurpleThemeMode.system
          ? ThemeMode.system
          : appearance == PurpleThemeMode.light
              ? ThemeMode.light
              : ThemeMode.dark,
      theme: lightTheme,
      darkTheme: darkTheme,
      routerConfig: router,
      builder: (context, child) {
        final mq = MediaQuery.of(context);
        Widget content = child ?? const SizedBox.shrink();

        if (authInit.isLoading) {
          content = Stack(
            fit: StackFit.expand,
            children: [
              content,
              const ColoredBox(
                color: purpleCanvasDark,
                child: Center(child: CircularProgressIndicator()),
              ),
            ],
          );
        } else if (authInit.hasError) {
          final message = authInit.error is StateError
              ? authInit.error.toString()
              : 'Could not start Purple. Check your connection and try again.';
          content = ColoredBox(
            color: purpleCanvasDark,
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70),
                ),
              ),
            ),
          );
        }

        return MediaQuery(
          data: mq.copyWith(platformBrightness: brightness),
          child: authInit.isLoading || authInit.hasError
              ? ColoredBox(color: canvasColor, child: content)
              : WearableOAuthListener(
                  child: ColoredBox(
                    color: canvasColor,
                    child: content,
                  ),
                ),
        );
      },
    );
  }
}
