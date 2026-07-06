import 'package:flutter/material.dart';

import '../shared/merged_style.dart';
import 'chat_copy.dart';

/// Ask Purple header matching merged preview `/chat`.
class ChatAskHeader extends StatelessWidget {
  const ChatAskHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final p = mergedPalette();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MergedSectionLabel(ChatCopy.askEyebrow),
        const SizedBox(height: 8),
        Text(
          '${ChatCopy.askTitleLine1}\n${ChatCopy.askTitleLine2}',
          style: medsSerif(
            fontSize: 40,
            letterSpacing: -0.8,
            height: 1.02,
            color: p.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        Divider(height: 1, color: p.divider),
      ],
    );
  }
}

TextStyle chatBodySerif({Color? color}) {
  final p = mergedPalette();
  return medsSerif(
    fontSize: 17,
    height: 1.5,
    color: color ?? p.textPrimary.withValues(alpha: 0.85),
  );
}

TextStyle chatBubbleText({required bool isUser}) {
  final p = mergedPalette();
  return medsSans(
    fontSize: 14,
    height: 1.45,
    color: isUser ? p.textPrimary.withValues(alpha: 0.92) : p.textPrimary.withValues(alpha: 0.9),
  );
}

TextStyle chatMuted({double fontSize = 14}) {
  return medsSans(fontSize: fontSize, color: mergedPalette().textTertiary);
}

TextStyle chatComposerHint() {
  return medsSans(fontSize: 11, color: mergedPalette().textTertiary);
}

TextStyle chatCareTitle() {
  return medsSerif(fontSize: 20, color: mergedPalette().textPrimary);
}

TextStyle chatCareSubtitle() {
  return medsSans(fontSize: 14, color: mergedPalette().textSecondary);
}
