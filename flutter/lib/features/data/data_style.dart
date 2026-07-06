import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';

/// Dark-theme palette for Data, Vitals, Biometrics, Insights (merged preview).
class DataPalette {
  DataPalette._(this._colors, this._glass);

  factory DataPalette.dark() {
    final tokens = PurpleTokens.loaded;
    return DataPalette._(tokens.colorsFor('dark'), tokens.glassFor('dark'));
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
  Color get info => parseTokenColor(_colors.info);
  Color get destructive => parseTokenColor(_colors.destructive);
  Color get glassFill => parseTokenColor(_glass.fillFallback);
}

TextStyle dataEyebrow({Color? color, DataPalette? palette}) {
  final c =
      color ?? palette?.textTertiary ?? Colors.white.withValues(alpha: 0.55);
  return PurpleType.sansStyle(
    fontSize: 11,
    letterSpacing: 0.88,
    fontWeight: FontWeight.w600,
    color: c,
  );
}

TextStyle dataSerif({
  required double fontSize,
  Color? color,
  double height = 1.05,
  double? letterSpacing,
  FontWeight fontWeight = FontWeight.w600,
  List<FontFeature>? fontFeatures,
}) {
  return PurpleType.serifStyle(
    fontSize: fontSize,
    height: height,
    letterSpacing: letterSpacing,
    fontWeight: fontWeight,
    color: color,
    fontFeatures: fontFeatures,
  );
}

TextStyle dataSans({
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

/// Uppercase section label (`.section-head` left span).
class DataSectionEyebrow extends StatelessWidget {
  const DataSectionEyebrow(this.text, {super.key, this.palette});

  final String text;
  final DataPalette? palette;

  @override
  Widget build(BuildContext context) {
    return Text(text.toUpperCase(), style: dataEyebrow(palette: palette));
  }
}

/// Section head with optional trailing count.
class DataSectionHead extends StatelessWidget {
  const DataSectionHead({
    super.key,
    required this.title,
    this.trailing,
  });

  final String title;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title.toUpperCase(),
              style: dataEyebrow(palette: p),
            ),
          ),
          if (trailing != null)
            Text(trailing!, style: dataSans(fontSize: 11, color: p.textTertiary)),
        ],
      ),
    );
  }
}

/// Merged preview page title (22pt greeting on Data tab).
class DataPageTitle extends StatelessWidget {
  const DataPageTitle({
    super.key,
    required this.title,
    this.subtitle,
  });

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: dataSerif(fontSize: 22, height: 1.1, color: p.textPrimary),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: dataSans(fontSize: 13, height: 1.4, color: p.textTertiary),
          ),
        ],
      ],
    );
  }
}

/// Large serif header for Vitals / Insights / My Health drill pages.
class DataHeroHeader extends StatelessWidget {
  const DataHeroHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    this.subtitle,
    this.fontSize = 44,
  });

  final String eyebrow;
  final String title;
  final String? subtitle;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DataSectionEyebrow(eyebrow, palette: p),
        const SizedBox(height: 12),
        Text(
          title,
          style: dataSerif(
            fontSize: fontSize,
            letterSpacing: fontSize * -0.02,
            color: p.textPrimary,
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 8),
          Text(
            subtitle!,
            style: dataSans(fontSize: 15, color: p.textTertiary),
          ),
        ],
      ],
    );
  }
}

/// Back link matching preview `.back-link`.
class DataBackLink extends StatelessWidget {
  const DataBackLink({
    super.key,
    required this.label,
    required this.onTap,
  });

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    return TextButton.icon(
      onPressed: onTap,
      style: TextButton.styleFrom(
        padding: EdgeInsets.zero,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      icon: Icon(Icons.arrow_back, size: 16, color: p.textTertiary),
      label: Text(label, style: dataSans(fontSize: 14, color: p.textTertiary)),
    );
  }
}

/// Rounded card shell (`.card`, `.metric-row` background).
class DataCardShell extends StatelessWidget {
  const DataCardShell({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.onTap,
    this.highlight = false,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    final decoration = BoxDecoration(
      color: highlight ? p.purpleSoft : p.surface,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(
        color: highlight ? p.purplePrimary.withValues(alpha: 0.35) : p.divider,
      ),
    );
    if (onTap == null) {
      return Container(
        width: double.infinity,
        padding: padding,
        decoration: decoration,
        child: child,
      );
    }
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: decoration,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}

/// Search field for Data tab metric filter.
class DataSearchField extends StatelessWidget {
  const DataSearchField({
    super.key,
    required this.onChanged,
    this.enabled = true,
    this.hintText = 'Search metric_key or display_name…',
  });

  final ValueChanged<String> onChanged;
  final bool enabled;
  final String hintText;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    return TextField(
      enabled: enabled,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: dataSans(fontSize: 14, color: p.textTertiary),
        filled: true,
        fillColor: p.surfaceSecondary,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: p.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: p.divider),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: p.divider.withValues(alpha: 0.5)),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
      style: dataSans(fontSize: 14, color: p.textPrimary),
      onChanged: onChanged,
    );
  }
}

/// Stat box for metric detail (`.stat-box`).
class DataStatBox extends StatelessWidget {
  const DataStatBox({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    return Expanded(
      child: DataCardShell(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: dataSans(fontSize: 11, color: p.textTertiary),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: dataSerif(fontSize: 20, color: p.purplePrimary),
            ),
          ],
        ),
      ),
    );
  }
}
