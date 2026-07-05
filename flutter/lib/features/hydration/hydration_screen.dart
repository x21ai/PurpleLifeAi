import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../shared/glass_helpers.dart';
import '../../shell/routes.dart';

/// Hydration day view stub. Full timeline ships in a later wave.
class HydrationScreen extends StatelessWidget {
  const HydrationScreen({super.key});

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
                onPressed: () => context.go(AppRoutes.vitals),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                icon: Icon(Icons.arrow_back, size: 16, color: muted),
                label: Text(
                  'Vitals',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: muted,
                      ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'INTAKE',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Water, electrolytes,\nand déjà vu.',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      fontSize: 44,
                      height: 1.02,
                      letterSpacing: 44 * -0.02,
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
                    Text(
                      'Hydration timeline coming soon',
                      style: TextStyle(
                        fontFamily: PurpleType.serif,
                        fontSize: 22,
                        color: const Color(0xFFF2F2F5),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Log water, drinks, and aura events with hourly precision. This Flutter route is wired for navigation; full intake UI ships in a later phase.',
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
