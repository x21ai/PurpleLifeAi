import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Curved score arc mirroring web `ScoreArc` (lower 200° of a circle).
enum ScoreArcTone { ink, alert, cream }

class ScoreArc extends StatelessWidget {
  const ScoreArc({
    super.key,
    required this.score,
    this.size = 260,
    this.stroke = 6,
    this.tone = ScoreArcTone.ink,
    this.semanticLabel,
  });

  final double score;
  final double size;
  final double stroke;
  final ScoreArcTone tone;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticLabel ?? 'Score ${score.round()}',
      child: CustomPaint(
        size: Size(size, size),
        painter: _ScoreArcPainter(
          score: score,
          stroke: stroke,
          tone: tone,
        ),
      ),
    );
  }
}

class _ScoreArcPainter extends CustomPainter {
  _ScoreArcPainter({
    required this.score,
    required this.stroke,
    required this.tone,
  });

  final double score;
  final double stroke;
  final ScoreArcTone tone;

  static const _startDeg = 170.0;
  static const _sweepDeg = 200.0;

  Offset _polar(double cx, double cy, double r, double deg) {
    final rad = deg * math.pi / 180;
    return Offset(cx + r * math.cos(rad), cy + r * math.sin(rad));
  }

  Color _fillColor() {
    return switch (tone) {
      ScoreArcTone.alert => const Color(0xFFB8453A),
      ScoreArcTone.cream => const Color(0xFFF2F2F5),
      ScoreArcTone.ink => const Color(0xFFF2F2F5),
    };
  }

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width / 2 - stroke;

    final start = _polar(cx, cy, r, _startDeg);
    final end = _polar(cx, cy, r, _startDeg + _sweepDeg);

    final trackPath = Path()
      ..moveTo(start.dx, start.dy)
      ..arcToPoint(
        end,
        radius: Radius.circular(r),
        clockwise: true,
        largeArc: true,
      );

    final trackPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = Colors.white.withValues(alpha: 0.18);

    canvas.drawPath(trackPath, trackPaint);

    final pct = (score.clamp(0, 100)) / 100;
    final length = math.pi * r * (_sweepDeg / 180);
    final dashLength = length * pct;

    final fillPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = _fillColor();

    final metrics = trackPath.computeMetrics().first;
    final extractPath = metrics.extractPath(0, dashLength);
    canvas.drawPath(extractPath, fillPaint);

    final endPoint = _polar(cx, cy, r, _startDeg + _sweepDeg * pct);
    canvas.drawCircle(
      endPoint,
      stroke * 0.9,
      Paint()
        ..color = const Color(0xFF0A0710)
        ..style = PaintingStyle.fill,
    );
    canvas.drawCircle(
      endPoint,
      stroke * 0.9,
      Paint()
        ..color = _fillColor()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke * 0.5,
    );
  }

  @override
  bool shouldRepaint(covariant _ScoreArcPainter oldDelegate) {
    return oldDelegate.score != score ||
        oldDelegate.stroke != stroke ||
        oldDelegate.tone != tone;
  }
}
