import 'package:flutter/material.dart';

import 'glass_helpers.dart';
import 'merged_style.dart';

/// Glass-styled loading placeholders that reserve layout height (CLS-safe).
class LoadingSkeleton extends StatelessWidget {
  const LoadingSkeleton({
    super.key,
    this.tileCount = 6,
    this.sectionTitle = 'Your signals',
  });

  final int tileCount;
  final String sectionTitle;

  @override
  Widget build(BuildContext context) {
    final p = mergedPalette();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MergedSectionLabel(sectionTitle),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 1.6,
          ),
          itemCount: tileCount,
          itemBuilder: (context, index) => _PulseTile(palette: p),
        ),
      ],
    );
  }
}

class _PulseTile extends StatefulWidget {
  const _PulseTile({required this.palette});

  final MergedPalette palette;

  @override
  State<_PulseTile> createState() => _PulseTileState();
}

class _PulseTileState extends State<_PulseTile> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shimmer = widget.palette.textPrimary;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Opacity(
          opacity: 0.45 + (_controller.value * 0.35),
          child: child,
        );
      },
      child: GlassSurface(
        padding: const EdgeInsets.all(16),
        borderRadius: 16,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 72,
              height: 10,
              decoration: BoxDecoration(
                color: shimmer.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const Spacer(),
            Container(
              width: 48,
              height: 24,
              decoration: BoxDecoration(
                color: shimmer.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(6),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Hero score skeleton for Today readiness band.
class ScoreHeroSkeleton extends StatelessWidget {
  const ScoreHeroSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final shimmer = mergedPalette().textPrimary;
    return GlassSurface(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
      borderRadius: 32,
      child: Column(
        children: [
          Container(
            width: 88,
            height: 72,
            decoration: BoxDecoration(
              color: shimmer.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: 72,
            height: 10,
            decoration: BoxDecoration(
              color: shimmer.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
    );
  }
}

/// Three-up score tile row skeleton.
class ScoreTileStripSkeleton extends StatelessWidget {
  const ScoreTileStripSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final shimmer = mergedPalette().textPrimary;
    return GlassSurface(
      padding: const EdgeInsets.all(8),
      child: Row(
        children: List.generate(
          3,
          (index) => Expanded(
            child: Padding(
              padding: EdgeInsets.only(left: index == 0 ? 0 : 4),
              child: Container(
                height: 88,
                decoration: BoxDecoration(
                  color: shimmer.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
