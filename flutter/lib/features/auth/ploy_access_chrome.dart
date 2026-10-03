import 'package:flutter/material.dart';

/// Light access chrome from the live Ploy pilot
/// (`ploy-staging` `.purplelife-pilot` tokens and `PrivacyShield`).
class PloyAccessColors {
  PloyAccessColors._();

  static const canvas = Color(0xFFF8F7FA);
  static const surface = Color(0xFFFFFFFF);
  static const rail = Color(0xFFF1EFF4);
  static const tint = Color(0xFFF0E9FB);
  static const line = Color(0xFFDDDBE1);
  static const ink = Color(0xFF18161D);
  static const muted = Color(0xFF67646F);
  static const accent = Color(0xFF8E61CF);
  static const pink = Color(0xFFF070BE);
  static const coral = Color(0xFFFF7769);
  static const blue = Color(0xFF009BF0);
  static const shieldShadow = Color(0xFF6C59D6);
}

/// Soft layered shield from `PrivacyShield` in
/// `ploy-staging/src/components/pages/pilot/components/mobile-graphics.tsx`.
class PrivacyShieldGraphic extends StatelessWidget {
  const PrivacyShieldGraphic({super.key, this.maxWidth = 310});

  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'A soft layered shield representing privacy controls',
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: const AspectRatio(
          aspectRatio: 320 / 230,
          child: CustomPaint(painter: _PrivacyShieldPainter()),
        ),
      ),
    );
  }
}

class _PrivacyShieldPainter extends CustomPainter {
  const _PrivacyShieldPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final sx = size.width / 320;
    final sy = size.height / 230;
    Offset p(double x, double y) => Offset(x * sx, y * sy);

    final ground = Path()
      ..addOval(
        Rect.fromCenter(
          center: p(160, 199),
          width: 168 * sx,
          height: 32 * sy,
        ),
      );
    canvas.drawPath(ground, Paint()..color = PloyAccessColors.tint);

    final shield = Path()
      ..moveTo(p(160, 25).dx, p(160, 25).dy)
      ..cubicTo(
        p(195, 46).dx,
        p(195, 46).dy,
        p(226, 48).dx,
        p(226, 48).dy,
        p(246, 49).dx,
        p(246, 49).dy,
      )
      ..lineTo(p(246, 108).dx, p(246, 108).dy)
      ..cubicTo(
        p(246, 164).dx,
        p(246, 164).dy,
        p(214, 199).dx,
        p(214, 199).dy,
        p(160, 220).dx,
        p(160, 220).dy,
      )
      ..cubicTo(
        p(106, 199).dx,
        p(106, 199).dy,
        p(74, 164).dx,
        p(74, 164).dy,
        p(74, 108).dx,
        p(74, 108).dy,
      )
      ..lineTo(p(74, 49).dx, p(74, 49).dy)
      ..cubicTo(
        p(94, 48).dx,
        p(94, 48).dy,
        p(125, 46).dx,
        p(125, 46).dy,
        p(160, 25).dx,
        p(160, 25).dy,
      )
      ..close();

    final shadowSigma = 18 * sx;
    canvas.drawPath(
      shield.shift(Offset(0, 18 * sy)),
      Paint()
        ..color = PloyAccessColors.shieldShadow.withValues(alpha: 0.24)
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, shadowSigma),
    );

    final bounds = shield.getBounds();
    canvas.drawPath(
      shield,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            PloyAccessColors.pink,
            PloyAccessColors.accent,
            PloyAccessColors.blue,
          ],
          stops: [0, 0.55, 1],
        ).createShader(bounds),
    );

    final check = Path()
      ..moveTo(p(135, 116).dx, p(135, 116).dy)
      ..lineTo(p(152, 133).dx, p(152, 133).dy)
      ..lineTo(p(188, 91).dx, p(188, 91).dy);
    canvas.drawPath(
      check,
      Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 9 * sx
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );

    final highlight = Path()
      ..moveTo(p(117, 61).dx, p(117, 61).dy)
      ..cubicTo(
        p(130, 58).dx,
        p(130, 58).dy,
        p(144, 53).dx,
        p(144, 53).dy,
        p(160, 44).dx,
        p(160, 44).dy,
      );
    canvas.drawPath(
      highlight,
      Paint()
        ..color = Colors.white.withValues(alpha: 0.32)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 8 * sx
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Light frame used by the Ploy access pages (canvas, no fake status bar).
class PloyAccessPage extends StatelessWidget {
  const PloyAccessPage({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: PloyAccessColors.canvas,
      colorScheme: const ColorScheme.light(
        primary: PloyAccessColors.accent,
        onPrimary: Colors.white,
        surface: PloyAccessColors.surface,
        onSurface: PloyAccessColors.ink,
        error: PloyAccessColors.coral,
      ),
      textSelectionTheme: const TextSelectionThemeData(
        cursorColor: PloyAccessColors.accent,
        selectionColor: Color(0x598E61CF),
      ),
    );
    final keyboard = MediaQuery.viewInsetsOf(context).bottom;
    return Theme(
      data: theme,
      child: Scaffold(
        backgroundColor: PloyAccessColors.canvas,
        resizeToAvoidBottomInset: true,
        body: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final viewport = constraints.maxHeight.isFinite
                  ? constraints.maxHeight
                  : MediaQuery.sizeOf(context).height;
              return Align(
                alignment: Alignment.topCenter,
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: 430,
                    minHeight: viewport,
                    maxHeight: viewport,
                  ),
                  child: Padding(
                    padding: EdgeInsets.only(bottom: keyboard),
                    child: child,
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class PloyAccessHeader extends StatelessWidget {
  const PloyAccessHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    this.shieldMaxWidth = 310,
  });

  final String eyebrow;
  final String title;
  final String subtitle;
  final double shieldMaxWidth;

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height;
    final shield = height < 700
        ? 150.0
        : height < 820
            ? 210.0
            : shieldMaxWidth;
    return Column(
      children: [
        PrivacyShieldGraphic(maxWidth: shield),
        Transform.translate(
          offset: const Offset(0, -8),
          child: Column(
            children: [
              Text(
                eyebrow.toUpperCase(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.72,
                  color: PloyAccessColors.accent,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 33,
                  height: 1.02,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -1.65,
                  color: PloyAccessColors.ink,
                ),
              ),
              if (subtitle.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  subtitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 15,
                    height: 1.45,
                    color: PloyAccessColors.muted,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class PloyAccessCard extends StatelessWidget {
  const PloyAccessCard({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: PloyAccessColors.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: PloyAccessColors.line),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: child,
      ),
    );
  }
}

class PloyFieldLabel extends StatelessWidget {
  const PloyFieldLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: PloyAccessColors.ink,
      ),
    );
  }
}

InputDecoration ployFieldDecoration({
  Widget? prefix,
  Widget? suffix,
}) {
  const radius = BorderRadius.all(Radius.circular(16));
  const idle = OutlineInputBorder(
    borderRadius: radius,
    borderSide: BorderSide(color: Colors.transparent),
  );
  final focused = OutlineInputBorder(
    borderRadius: radius,
    borderSide: BorderSide(
      color: PloyAccessColors.accent.withValues(alpha: 0.35),
      width: 2,
    ),
  );
  return InputDecoration(
    filled: true,
    fillColor: PloyAccessColors.rail,
    isDense: true,
    contentPadding: EdgeInsets.fromLTRB(prefix == null ? 16 : 0, 14, 8, 14),
    prefixIcon: prefix,
    prefixIconConstraints: const BoxConstraints(minWidth: 44, minHeight: 48),
    suffixIcon: suffix,
    constraints: const BoxConstraints(minHeight: 48),
    border: idle,
    enabledBorder: idle,
    focusedBorder: focused,
    disabledBorder: idle,
  );
}

class PloyAccentButton extends StatelessWidget {
  const PloyAccentButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.showArrow = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool showArrow;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: onPressed == null ? 0.5 : 1,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: PloyAccessColors.accent,
          disabledBackgroundColor: PloyAccessColors.accent,
          foregroundColor: Colors.white,
          disabledForegroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label),
            if (showArrow) ...[
              const SizedBox(width: 8),
              const Icon(Icons.arrow_forward, size: 18),
            ],
          ],
        ),
      ),
    );
  }
}

class PloyLinkButton extends StatelessWidget {
  const PloyLinkButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.accent = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        foregroundColor:
            accent ? PloyAccessColors.accent : PloyAccessColors.muted,
        disabledForegroundColor: PloyAccessColors.muted.withValues(alpha: 0.5),
        minimumSize: const Size.fromHeight(40),
        textStyle: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
      child: Text(label),
    );
  }
}

class PloyPrivacyNote extends StatelessWidget {
  const PloyPrivacyNote({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: PloyAccessColors.tint,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(
              Icons.lock_outline,
              size: 19,
              color: PloyAccessColors.accent,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                  fontSize: 12,
                  height: 1.45,
                  color: PloyAccessColors.muted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
