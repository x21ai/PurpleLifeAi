import 'package:flutter/material.dart';

import '../../design/tokens.dart';
import 'glass_helpers.dart';

/// Today three-up score tile mirroring web `ScoreTile`
/// (`src/components/ui-oura/v2/score-tile.tsx`). The active tile renders as a
/// glass card with a primary ring and a larger numeral; inactive tiles are
/// dimmed. A null value renders as an en dash, never a fake number.
class ScoreTile extends StatelessWidget {
  const ScoreTile({
    super.key,
    required this.label,
    required this.value,
    this.active = false,
    this.onTap,
  });

  final String label;
  final double? value;
  final bool active;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final minTarget = tokens.touch.minTarget;
    // Web: active 56px (72 on sm), inactive 36px (44 on sm). Mobile scale.
    final numberSize = active ? 56.0 : 36.0;
    final display = value?.round().toString() ?? '–';

    Widget content = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          display,
          style: TextStyle(
            fontSize: numberSize,
            fontWeight: FontWeight.w300,
            height: tokens.typography.lineHeight('numericDisplay'),
            letterSpacing: tokens.typography.letterSpacing('numericDisplay'),
            color: Colors.white.withValues(alpha: 0.96),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: tokens.typography.labelSize('labelEyebrow'),
            letterSpacing: tokens.typography.letterSpacing('labelEyebrow'),
            fontWeight: active ? FontWeight.w600 : FontWeight.w500,
            color: active
                ? Colors.white.withValues(alpha: 0.85)
                : Colors.white.withValues(alpha: 0.55),
          ),
        ),
      ],
    );

    if (active) {
      content = DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: parseTokenColor(
              tokens.colorsFor('dark').purplePrimary,
            ).withValues(alpha: 0.35),
          ),
          boxShadow: [
            BoxShadow(
              color: parseTokenColor(
                tokens.colorsFor('dark').purplePrimary,
              ).withValues(alpha: 0.12),
              blurRadius: 28,
            ),
          ],
        ),
        child: GlassSurface(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 20),
          borderRadius: 18,
          child: content,
        ),
      );
    } else {
      content = Opacity(
        opacity: 0.7,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
          child: content,
        ),
      );
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        splashColor: Colors.white.withValues(alpha: 0.06),
        highlightColor: Colors.white.withValues(alpha: 0.04),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: minTarget),
          child: content,
        ),
      ),
    );
  }
}
