import 'package:flutter/material.dart';

import '../../design/purple_type.dart';

import '../../design/tokens.dart';

/// AI narrative voice mirroring web `NarrativeBlock` as used on Today:
/// `glass-card rounded-[20px] border-primary/10` over the serif body with the
/// sparkles marker (`src/components/ui-oura/v2/narrative-block.tsx`).
class NarrativeBlock extends StatelessWidget {
  const NarrativeBlock({
    super.key,
    required this.text,
  });

  final String text;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final glass = tokens.glassFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);

    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 600),
      padding: EdgeInsets.all(tokens.spacing.lg),
      decoration: BoxDecoration(
        color: parseTokenColor(glass.fill),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: purple.withValues(alpha: 0.10),
          width: glass.borderWidthPx,
        ),
        boxShadow: glassShadowsFromTokens(glass.shadow),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.auto_awesome_outlined,
            size: 16,
            color: purple,
          ),
          SizedBox(height: tokens.spacing.sm),
          Text(
            text.trim(),
            style: TextStyle(
              fontFamily: PurpleType.serif,
              fontSize: tokens.typography.labelSize('bodySerif'),
              height: tokens.typography.lineHeight('bodySerif'),
              color: parseTokenColor(colors.textPrimary).withValues(alpha: 0.85),
            ),
          ),
        ],
      ),
    );
  }
}
