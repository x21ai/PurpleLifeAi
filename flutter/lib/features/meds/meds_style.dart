import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';

/// Dark-theme token palette for meds routes (Merged preview parity).
class MedsPalette {
  MedsPalette._(this._colors, this._glass);

  factory MedsPalette.dark() {
    final tokens = PurpleTokens.loaded;
    return MedsPalette._(tokens.colorsFor('dark'), tokens.glassFor('dark'));
  }

  final PurpleColorTokens _colors;
  final PurpleGlassTokens _glass;

  Color get canvas => parseTokenColor(_colors.canvas);
  Color get surface => parseTokenColor(_colors.backgroundPrimary);
  Color get surfaceSecondary => parseTokenColor(_colors.backgroundSecondary);
  Color get textPrimary => parseTokenColor(_colors.textPrimary);
  Color get textSecondary => parseTokenColor(_colors.textSecondary);
  Color get textTertiary => parseTokenColor(_colors.textTertiary);
  Color get purplePrimary => parseTokenColor(_colors.purplePrimary);
  Color get purpleSoft => parseTokenColor(_colors.purpleSoft);
  Color get divider => parseTokenColor(_colors.divider);
  Color get success => parseTokenColor(_colors.success);
  Color get destructive => parseTokenColor(_colors.destructive);
  Color get glassFill => parseTokenColor(_glass.fillFallback);
}

TextStyle medsEyebrow({Color? color, MedsPalette? palette}) {
  final c = color ?? palette?.textTertiary ?? Colors.white.withValues(alpha: 0.55);
  return PurpleType.sansStyle(
    fontSize: 11,
    letterSpacing: 0.88,
    fontWeight: FontWeight.w600,
    color: c,
  );
}

TextStyle medsSerif({
  required double fontSize,
  Color? color,
  double height = 1.02,
  double? letterSpacing,
  FontWeight fontWeight = FontWeight.w600,
}) {
  return PurpleType.serifStyle(
    fontSize: fontSize,
    height: height,
    letterSpacing: letterSpacing,
    fontWeight: fontWeight,
    color: color,
  );
}

TextStyle medsSans({
  double fontSize = 14,
  double height = 1.45,
  Color? color,
  FontWeight fontWeight = FontWeight.w400,
  double? letterSpacing,
  List<FontFeature>? fontFeatures,
}) {
  return PurpleType.sansStyle(
    fontSize: fontSize,
    height: height,
    color: color,
    fontWeight: fontWeight,
    letterSpacing: letterSpacing,
    fontFeatures: fontFeatures,
  );
}

/// Uppercase section label matching preview `.eyebrow` / web `label-eyebrow`.
class MedsSectionEyebrow extends StatelessWidget {
  const MedsSectionEyebrow(this.text, {super.key, this.palette});

  final String text;
  final MedsPalette? palette;

  @override
  Widget build(BuildContext context) {
    final p = palette ?? MedsPalette.dark();
    return Text(
      text.toUpperCase(),
      style: medsEyebrow(palette: p),
    );
  }
}

/// Serif page title with optional offline pill (44pt refresh targets elsewhere).
class MedsPageHeader extends StatelessWidget {
  const MedsPageHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    this.subtitle,
    this.isOffline = false,
    this.large = false,
  });

  final String eyebrow;
  final String title;
  final String? subtitle;
  final bool isOffline;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final p = MedsPalette.dark();
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MedsSectionEyebrow(eyebrow, palette: p),
              const SizedBox(height: 12),
              Text(
                title,
                style: medsSerif(
                  fontSize: large ? 44 : 36,
                  letterSpacing: large ? -0.8 : -0.5,
                  color: p.textPrimary,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 8),
                Text(
                  subtitle!,
                  style: medsSans(
                    fontSize: 15,
                    height: 1.45,
                    color: p.textTertiary,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (isOffline)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: p.surfaceSecondary,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: p.divider),
            ),
            child: Text(
              'Offline',
              style: medsSans(fontSize: 11, color: p.textTertiary),
            ),
          ),
      ],
    );
  }
}

/// Rounded list shell using token glass fill (no full-bleed edge drift).
class MedsGroupedListShell extends StatelessWidget {
  const MedsGroupedListShell({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final p = MedsPalette.dark();
    return Container(
      decoration: BoxDecoration(
        color: p.glassFill,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: p.divider),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: children),
    );
  }
}

/// Divider between grouped list rows.
Widget medsListDivider(MedsPalette p) => Divider(
      height: 1,
      thickness: 1,
      color: p.divider,
    );
