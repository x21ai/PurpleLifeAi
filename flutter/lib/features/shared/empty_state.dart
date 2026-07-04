import 'dart:ui';

import 'package:flutter/material.dart';

import 'glass_helpers.dart';

/// Calm empty state card with glass styling. No fake health data.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.body,
    this.primaryActionLabel,
    this.onPrimaryAction,
    this.secondaryActionLabel,
    this.onSecondaryAction,
  });

  final String eyebrow;
  final String title;
  final String body;
  final String? primaryActionLabel;
  final VoidCallback? onPrimaryAction;
  final String? secondaryActionLabel;
  final VoidCallback? onSecondaryAction;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      borderRadius: 24,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: -96,
            right: -64,
            child: IgnorePointer(
              child: Container(
                width: 256,
                height: 256,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.18),
                ),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 48, sigmaY: 48),
                  child: const SizedBox.expand(),
                ),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                eyebrow.toUpperCase(),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontFamily: 'Georgia',
                      height: 1.05,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                body,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.75),
                      height: 1.5,
                    ),
              ),
              if (primaryActionLabel != null) ...[
                const SizedBox(height: 24),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    FilledButton(
                      onPressed: onPrimaryAction,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(0, 48),
                        shape: const StadiumBorder(),
                      ),
                      child: Text(primaryActionLabel!),
                    ),
                    if (secondaryActionLabel != null)
                      TextButton(
                        onPressed: onSecondaryAction,
                        child: Text(
                          secondaryActionLabel!,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.55),
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
