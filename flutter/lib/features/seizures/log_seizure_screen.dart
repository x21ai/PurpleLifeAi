import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';

/// Stub for web `/seizures/new` until full seizure logging ships on Flutter.
class LogSeizureScreen extends StatelessWidget {
  const LogSeizureScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final muted = Colors.white.withValues(alpha: 0.55);

    return CanvasBackground(
      child: SingleChildScrollView(
        padding: EdgeInsets.only(
          top: tokens.spacing.x2,
          bottom: 120,
        ),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go(AppRoutes.today),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                icon: Icon(Icons.arrow_back, size: 16, color: muted),
                label: Text(
                  'Today',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: muted,
                      ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'LOG EVENT',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Log a seizure',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: 'Georgia',
                      fontSize: 44,
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 24),
              GlassSurface(
                borderRadius: 24,
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Seizure logging coming soon',
                      style: TextStyle(
                        fontFamily: 'Georgia',
                        fontSize: 22,
                        color: Color(0xFFF2F2F5),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'One-tap seizure logging with time, type, and optional photos ships in a later Flutter phase. Use the web app at purplelife.org for full logging today.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.7),
                            height: 1.45,
                          ),
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
}
