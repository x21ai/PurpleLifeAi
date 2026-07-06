import 'package:flutter/material.dart';

import '../../design/purple_type.dart';

import '../../design/tokens.dart';
import 'merged_style.dart';

/// Readiness band matching web `ScoreBand` / `bandForReadiness`.
enum ScoreBand { excellent, good, fair, attention }

ScoreBand bandForScore(double score) {
  if (score >= 85) return ScoreBand.excellent;
  if (score >= 70) return ScoreBand.good;
  if (score >= 50) return ScoreBand.fair;
  return ScoreBand.attention;
}

LinearGradient gradientForBand(ScoreBand band) {
  switch (band) {
    case ScoreBand.excellent:
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF4A8B6F), Color(0xFF2C6450)],
      );
    case ScoreBand.good:
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF4A6FA5), Color(0xFF2C4E7A)],
      );
    case ScoreBand.fair:
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFC58A3F), Color(0xFF8B5E26)],
      );
    case ScoreBand.attention:
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFB8453A), Color(0xFF7A2A22)],
      );
  }
}

String phraseForScore(double score) {
  if (score >= 85) return 'A steady day.';
  if (score >= 70) return 'Doing alright.';
  if (score >= 50) return 'Worth slowing down.';
  return 'Time to be careful.';
}

/// Hero score band mirroring web `ScoreHero` (gradient, mountain, phrase).
class ScoreHero extends StatelessWidget {
  const ScoreHero({
    super.key,
    required this.score,
    this.label = 'Readiness',
    this.phrase,
    this.narrative,
    this.band,
    this.compact = false,
  });

  final double score;
  final String label;
  final String? phrase;
  final String? narrative;
  final ScoreBand? band;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final resolvedBand = band ?? bandForScore(score);
    final resolvedPhrase = phrase ?? phraseForScore(score);
    // Web ScoreHero: lg is 96px numeral / min-h 400, md is 72px / min-h 320.
    final numberSize = compact ? 72.0 : 96.0;
    final phraseSize = compact ? 24.0 : 28.0;
    final minHeight = compact ? 320.0 : 400.0;
    final radius = tokens.radius.x4;

    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Container(
        constraints: BoxConstraints(minHeight: minHeight),
        decoration: BoxDecoration(gradient: gradientForBand(resolvedBand)),
        child: Stack(
          children: [
            Positioned.fill(
              child: CustomPaint(
                painter: _MountainSilhouettePainter(
                  opacity: 0.25,
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.symmetric(
                horizontal: tokens.spacing.lg,
                vertical: tokens.spacing.x2,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    score.round().toString(),
                    style: TextStyle(
                      fontSize: numberSize,
                      fontWeight: FontWeight.w300,
                      height: tokens.typography.lineHeight('numericDisplay'),
                      letterSpacing:
                          tokens.typography.letterSpacing('numericDisplay'),
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    label.toUpperCase(),
                    style: medsEyebrow(
                      palette: mergedPalette(),
                      color: Colors.white.withValues(alpha: 0.85),
                    ),
                  ),
                  if (resolvedPhrase.isNotEmpty) ...[
                    SizedBox(height: tokens.spacing.lg),
                    Text(
                      resolvedPhrase,
                      textAlign: TextAlign.center,
                      style: PurpleType.serifStyle(
                        fontSize: phraseSize,
                        height: 1.2,
                        color: Colors.white,
                      ),
                    ),
                  ],
                  if (narrative != null && narrative!.trim().isNotEmpty) ...[
                    SizedBox(height: tokens.spacing.md),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 480),
                      child: Text(
                        narrative!.trim(),
                        textAlign: TextAlign.center,
                        style: PurpleType.bodySerif(
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MountainSilhouettePainter extends CustomPainter {
  _MountainSilhouettePainter({required this.opacity});

  final double opacity;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: opacity)
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(0, size.height)
      ..lineTo(0, size.height * 0.67)
      ..lineTo(size.width * 0.2, size.height * 0.4)
      ..lineTo(size.width * 0.33, size.height * 0.57)
      ..lineTo(size.width * 0.5, size.height * 0.27)
      ..lineTo(size.width * 0.67, size.height * 0.53)
      ..lineTo(size.width * 0.83, size.height * 0.37)
      ..lineTo(size.width, size.height * 0.6)
      ..lineTo(size.width, size.height)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
