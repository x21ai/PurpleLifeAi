import 'dart:convert';

import 'package:flutter/material.dart' show BoxShadow, Offset;
import 'package:flutter/services.dart';

/// Purple design tokens parsed from [design/tokens.json].
///
/// Loads from rootBundle when [load] is called, or use [PurpleTokens.fallback]
/// for embedded defaults that mirror the repo JSON (no asset registration needed).
class PurpleTokens {
  PurpleTokens._(this._raw);

  final Map<String, dynamic> _raw;

  static PurpleTokens? _cached;

  /// Asset path registered in `flutter/pubspec.yaml`.
  static const assetPath = 'packages/purple_design/../design/tokens.json';

  /// Relative asset path when tokens.json is copied under flutter/assets/.
  static const flutterAssetPath = 'assets/design/tokens.json';

  /// Repo-root mirror copied to flutter/design/tokens.json for pubspec bundling.
  static const repoMirrorAssetPath = 'design/tokens.json';

  /// Asset paths tried in order by [load] (web rootBundle requires pubspec registration).
  static const assetPaths = [flutterAssetPath, repoMirrorAssetPath];

  /// Embedded JSON mirror of design/tokens.json for offline/bootstrap use.
  static const String embeddedJson = _embeddedTokensJson;

  /// Parse tokens from a JSON string.
  factory PurpleTokens.fromJsonString(String source) {
    return PurpleTokens._(jsonDecode(source) as Map<String, dynamic>);
  }

  /// Load from Flutter assets via [rootBundle]. Tries [assetPaths] in order,
  /// then falls back to [embeddedJson] when no asset is registered.
  static Future<PurpleTokens> load({String? assetPathOverride}) async {
    if (_cached != null) return _cached!;
    final paths = assetPathOverride != null ? [assetPathOverride] : assetPaths;
    for (final path in paths) {
      try {
        final raw = await rootBundle.loadString(path);
        _cached = PurpleTokens.fromJsonString(raw);
        return _cached!;
      } on Object {
        continue;
      }
    }
    _cached = PurpleTokens.fallback;
    return _cached!;
  }

  /// Loaded tokens after [load], or [fallback] before bootstrap completes.
  static PurpleTokens get loaded => _cached ?? fallback;

  /// Synchronous access to embedded defaults (dark appearance).
  static final PurpleTokens fallback = PurpleTokens.fromJsonString(embeddedJson);

  String get version => _raw['version'] as String? ?? '1.0.0';
  String get defaultAppearance => _raw['defaultAppearance'] as String? ?? 'dark';

  PurpleColorTokens colorsFor(String appearance) =>
      PurpleColorTokens(_appearanceMap('colors', appearance));

  PurpleGlassTokens glassFor(String appearance) =>
      PurpleGlassTokens(_appearanceMap('glass', appearance));

  PurpleLayoutTokens get layout => PurpleLayoutTokens(_raw['layout'] as Map<String, dynamic>);

  PurpleRadiusTokens get radius => PurpleRadiusTokens(_raw['radius'] as Map<String, dynamic>);

  PurpleSpacingTokens get spacing =>
      PurpleSpacingTokens(_raw['spacing'] as Map<String, dynamic>);

  PurpleTouchTokens get touch => PurpleTouchTokens(_raw['touch'] as Map<String, dynamic>);

  PurpleTypographyTokens get typography =>
      PurpleTypographyTokens(_raw['typography'] as Map<String, dynamic>);

  Map<String, dynamic> _appearanceMap(String key, String appearance) {
    final bucket = _raw[key] as Map<String, dynamic>;
    final resolved = bucket[appearance] ?? bucket['dark'];
    return Map<String, dynamic>.from(resolved as Map);
  }
}

class PurpleColorTokens {
  PurpleColorTokens(this._raw);

  final Map<String, dynamic> _raw;

  String get canvas => _raw['canvas'] as String;
  String get backgroundPrimary => _raw['backgroundPrimary'] as String;
  String get backgroundSecondary => _raw['backgroundSecondary'] as String;
  String get backgroundTertiary => _raw['backgroundTertiary'] as String;
  String get textPrimary => _raw['textPrimary'] as String;
  String get textSecondary => _raw['textSecondary'] as String;
  String get textTertiary => _raw['textTertiary'] as String;
  String get textQuaternary => _raw['textQuaternary'] as String;
  String get divider => _raw['divider'] as String;
  String get purplePrimary => _raw['purplePrimary'] as String;
  String get purpleSoft => _raw['purpleSoft'] as String;
  String get purpleDeep => _raw['purpleDeep'] as String;
  String get accentWarm => _raw['accentWarm'] as String;
  String get success => _raw['success'] as String;
  String get warning => _raw['warning'] as String;
  String get danger => _raw['danger'] as String;
  String get info => _raw['info'] as String;
  String get destructive => _raw['destructive'] as String;
}

class PurpleGlassShadow implements PurpleGlassShadowLike {
  PurpleGlassShadow(Map<String, dynamic> raw)
      : offsetX = (raw['offsetX'] as num).toDouble(),
        offsetY = (raw['offsetY'] as num).toDouble(),
        blur = (raw['blur'] as num).toDouble(),
        color = raw['color'] as String,
        spread = (raw['spread'] as num?)?.toDouble() ?? 0,
        inset = raw['inset'] as bool? ?? false;

  @override
  final double offsetX;
  @override
  final double offsetY;
  @override
  final double blur;
  @override
  final double spread;
  @override
  final String color;
  @override
  final bool inset;
}

class PurpleGlassTokens {
  PurpleGlassTokens(this._raw);

  final Map<String, dynamic> _raw;

  String get fill => _raw['fill'] as String;
  String get fillThick => _raw['fillThick'] as String;
  String get fillThin => _raw['fillThin'] as String;
  String get fillFallback => _raw['fillFallback'] as String;
  String get border => _raw['border'] as String;
  String get borderOuter => _raw['borderOuter'] as String;
  String get navFill => _raw['navFill'] as String;
  String get navBorder => _raw['navBorder'] as String;
  double get blurPx => (_raw['blurPx'] as num).toDouble();
  double get blurThickPx => (_raw['blurThickPx'] as num).toDouble();
  double get blurThinPx => (_raw['blurThinPx'] as num).toDouble();
  double get saturate => (_raw['saturate'] as num).toDouble();
  double get navSaturate => (_raw['navSaturate'] as num).toDouble();
  double get navBlurOffsetPx => (_raw['navBlurOffsetPx'] as num).toDouble();
  double get topBlurOffsetPx => (_raw['topBlurOffsetPx'] as num).toDouble();
  double get sheetBlurOffsetPx => (_raw['sheetBlurOffsetPx'] as num).toDouble();
  double get thinSaturateMultiplier => (_raw['thinSaturateMultiplier'] as num).toDouble();
  double get borderWidthPx => (_raw['borderWidthPx'] as num).toDouble();
  double get navBarRadiusPx => (_raw['navBarRadiusPx'] as num).toDouble();

  List<PurpleGlassShadow> get shadow => (_raw['shadow'] as List<dynamic>)
      .map((e) => PurpleGlassShadow(Map<String, dynamic>.from(e as Map)))
      .toList();

  PurpleGlassShadow get highlight =>
      PurpleGlassShadow(Map<String, dynamic>.from(_raw['highlight'] as Map));

  PurpleGlassShadow get navShadowUp =>
      PurpleGlassShadow(Map<String, dynamic>.from(_raw['navShadowUp'] as Map));

  double navBlurPx(GlassMaterialVariant variant) {
    switch (variant) {
      case GlassMaterialVariant.regular:
        return blurPx + navBlurOffsetPx;
      case GlassMaterialVariant.thick:
        return blurThickPx + navBlurOffsetPx;
      case GlassMaterialVariant.thin:
        return blurThinPx + navBlurOffsetPx;
      case GlassMaterialVariant.top:
        return blurPx + topBlurOffsetPx;
      case GlassMaterialVariant.sheet:
        return blurPx + sheetBlurOffsetPx;
      case GlassMaterialVariant.nav:
        return blurPx + navBlurOffsetPx;
    }
  }
}

/// Minimal structural type so shadow helpers stay decoupled from token classes.
abstract class PurpleGlassShadowLike {
  double get offsetX;
  double get offsetY;
  double get blur;
  double get spread;
  String get color;
  bool get inset;
}

/// Parse hex (#RRGGBB) or rgba(r, g, b, a) strings from design tokens.
Color parseTokenColor(String value) {
  final trimmed = value.trim();
  if (trimmed.startsWith('#')) {
    final hex = trimmed.substring(1);
    if (hex.length == 6) {
      return Color(int.parse('FF$hex', radix: 16));
    }
    if (hex.length == 8) {
      return Color(int.parse(hex, radix: 16));
    }
  }

  final rgba = RegExp(
    r'^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$',
  ).firstMatch(trimmed);
  if (rgba != null) {
    final r = int.parse(rgba.group(1)!);
    final g = int.parse(rgba.group(2)!);
    final b = int.parse(rgba.group(3)!);
    final a = rgba.group(4) != null ? double.parse(rgba.group(4)!) : 1.0;
    return Color.fromRGBO(r, g, b, a);
  }

  throw FormatException('Unsupported token color: $value');
}

List<BoxShadow> glassShadowsFromTokens(
  List<PurpleGlassShadowLike> layers, {
  bool includeHighlight = false,
  PurpleGlassShadowLike? highlight,
}) {
  return layers
      .where((layer) => !layer.inset)
      .map(
        (layer) => BoxShadow(
          color: parseTokenColor(layer.color),
          offset: Offset(layer.offsetX, layer.offsetY),
          blurRadius: layer.blur,
          spreadRadius: layer.spread,
        ),
      )
      .toList();
}

enum GlassMaterialVariant { regular, thick, thin, top, sheet, nav }

class PurpleLayoutTokens {
  PurpleLayoutTokens(this._raw);

  final Map<String, dynamic> _raw;

  double get contentMaxWidth => (_raw['contentMaxWidth'] as num).toDouble();
  double get contentMaxWidthMd => (_raw['contentMaxWidthMd'] as num).toDouble();
  double get contentMaxWidthWide => (_raw['contentMaxWidthWide'] as num).toDouble();
  double get sheetMaxWidth => (_raw['sheetMaxWidth'] as num).toDouble();
  double get pagePaddingX => (_raw['pagePaddingX'] as num).toDouble();
  double get pagePaddingXSm => (_raw['pagePaddingXSm'] as num).toDouble();
  double get pagePaddingXLg => (_raw['pagePaddingXLg'] as num).toDouble();
  double get nativeNavBarHeight => (_raw['nativeNavBarHeight'] as num).toDouble();
  double get nativeNavInsetMin => (_raw['nativeNavInsetMin'] as num).toDouble();
}

class PurpleRadiusTokens {
  PurpleRadiusTokens(this._raw);

  final Map<String, dynamic> _raw;

  double get base => (_raw['base'] as num).toDouble();
  double get sm => (_raw['sm'] as num).toDouble();
  double get md => (_raw['md'] as num).toDouble();
  double get lg => (_raw['lg'] as num).toDouble();
  double get xl => (_raw['xl'] as num).toDouble();
  double get x2 => (_raw['2xl'] as num).toDouble();
  double get x3 => (_raw['3xl'] as num).toDouble();
  double get x4 => (_raw['4xl'] as num).toDouble();
  double get sheetCard => (_raw['sheetCard'] as num).toDouble();
  double get sheetInset => (_raw['sheetInset'] as num).toDouble();
  double get pill => (_raw['pill'] as num).toDouble();
}

class PurpleSpacingTokens {
  PurpleSpacingTokens(this._raw);

  final Map<String, dynamic> _raw;

  double get gridUnit => (_raw['gridUnit'] as num).toDouble();
  double get xs => (_raw['xs'] as num).toDouble();
  double get sm => (_raw['sm'] as num).toDouble();
  double get md => (_raw['md'] as num).toDouble();
  double get lg => (_raw['lg'] as num).toDouble();
  double get xl => (_raw['xl'] as num).toDouble();
  double get x2 => (_raw['2xl'] as num).toDouble();
  double get x3 => (_raw['3xl'] as num).toDouble();
  double get x4 => (_raw['4xl'] as num).toDouble();
}

class PurpleTouchTokens {
  PurpleTouchTokens(this._raw);

  final Map<String, dynamic> _raw;

  double get minTarget => (_raw['minTarget'] as num).toDouble();
  double get pressScale => (_raw['pressScale'] as num).toDouble();
  int get pressDurationMs => _raw['pressDurationMs'] as int;
  List<double> get pressCurve =>
      (_raw['pressCurve'] as List<dynamic>).map((e) => (e as num).toDouble()).toList();
}

class PurpleTypographyTokens {
  PurpleTypographyTokens(this._raw);

  final Map<String, dynamic> _raw;

  String get fontSans => _raw['fontSans'] as String;
  String get fontSerif => _raw['fontSerif'] as String;

  PurpleFontWeights get weights {
    final map = _raw['weights'] as Map<String, dynamic>;
    return PurpleFontWeights(map);
  }

  double labelSize(String key) => (_raw['sizes'][key] as num).toDouble();
  double letterSpacing(String key) => (_raw['letterSpacing'][key] as num).toDouble();
  double lineHeight(String key) => (_raw['lineHeights'][key] as num).toDouble();
}

class PurpleFontWeights {
  PurpleFontWeights(this._raw);

  final Map<String, dynamic> _raw;

  int get display => _raw['display'] as int;
  int get regular => _raw['regular'] as int;
  int get medium => _raw['medium'] as int;
  int get semibold => _raw['semibold'] as int;
  int get wordmark => _raw['wordmark'] as int;
}

// Keep in sync with design/tokens.json. CI can diff against the file later.
const String _embeddedTokensJson = r'''
{
  "version": "1.0.0",
  "defaultAppearance": "dark",
  "colors": {
    "light": {
      "canvas": "#ffffff",
      "backgroundPrimary": "#ffffff",
      "backgroundSecondary": "#faf8fb",
      "backgroundTertiary": "#f2eef5",
      "textPrimary": "#0a0a0f",
      "textSecondary": "#4a4a52",
      "textTertiary": "#6b6b73",
      "textQuaternary": "#9a9aa1",
      "divider": "#ececef",
      "purplePrimary": "#5b2c82",
      "purpleSoft": "#ede4f4",
      "purpleDeep": "#3a1a55",
      "accentWarm": "#c58a3f",
      "success": "#4a8b6f",
      "warning": "#c58a3f",
      "danger": "#b8453a",
      "info": "#4a6fa5",
      "destructive": "#b8453a"
    },
    "dark": {
      "canvas": "#0a0710",
      "backgroundPrimary": "#0a0710",
      "backgroundSecondary": "#14101c",
      "backgroundTertiary": "#1f1a2b",
      "textPrimary": "#fafafc",
      "textSecondary": "#d8d8dd",
      "textTertiary": "#8b8b92",
      "textQuaternary": "#5c5c64",
      "divider": "#25202f",
      "purplePrimary": "#b084d1",
      "purpleSoft": "rgba(176, 132, 209, 0.12)",
      "purpleDeep": "#6e3fa0",
      "accentWarm": "#e8c39e",
      "success": "#6fb394",
      "warning": "#e8c39e",
      "danger": "#e8745c",
      "info": "#82a4d4",
      "destructive": "#e8745c"
    }
  },
  "glass": {
    "light": {
      "fill": "rgba(250, 250, 252, 0.8)",
      "fillThick": "rgba(250, 250, 252, 0.92)",
      "fillThin": "rgba(250, 250, 252, 0.65)",
      "fillFallback": "#faf8fb",
      "border": "rgba(255, 255, 255, 0.12)",
      "borderOuter": "rgba(0, 0, 0, 0.06)",
      "navFill": "rgba(252, 252, 254, 0.82)",
      "navBorder": "rgba(255, 255, 255, 0.14)",
      "blurPx": 30,
      "blurThickPx": 40,
      "blurThinPx": 20,
      "saturate": 1.08,
      "navSaturate": 1.35,
      "navBlurOffsetPx": 8,
      "topBlurOffsetPx": 4,
      "sheetBlurOffsetPx": 12,
      "thinSaturateMultiplier": 0.95,
      "borderWidthPx": 0.5,
      "shadow": [
        { "offsetX": 0, "offsetY": 4, "blur": 24, "color": "rgba(10, 10, 15, 0.06)" },
        { "offsetX": 0, "offsetY": 1, "blur": 2, "color": "rgba(10, 10, 15, 0.03)" }
      ],
      "highlight": {
        "offsetX": 0,
        "offsetY": 0.5,
        "blur": 0,
        "spread": 0,
        "color": "rgba(255, 255, 255, 0.72)",
        "inset": true
      },
      "navBarRadiusPx": 28,
      "navShadowUp": { "offsetX": 0, "offsetY": -4, "blur": 24, "color": "rgba(10, 10, 15, 0.05)" }
    },
    "dark": {
      "fill": "rgba(10, 7, 16, 0.8)",
      "fillThick": "rgba(10, 7, 16, 0.92)",
      "fillThin": "rgba(10, 7, 16, 0.62)",
      "fillFallback": "#14101c",
      "border": "rgba(255, 255, 255, 0.12)",
      "borderOuter": "rgba(255, 255, 255, 0.08)",
      "navFill": "rgba(10, 7, 16, 0.86)",
      "navBorder": "rgba(255, 255, 255, 0.1)",
      "blurPx": 32,
      "blurThickPx": 44,
      "blurThinPx": 20,
      "saturate": 1.12,
      "navSaturate": 1.4,
      "navBlurOffsetPx": 8,
      "topBlurOffsetPx": 4,
      "sheetBlurOffsetPx": 12,
      "thinSaturateMultiplier": 0.95,
      "borderWidthPx": 0.5,
      "shadow": [
        { "offsetX": 0, "offsetY": 8, "blur": 32, "color": "rgba(0, 0, 0, 0.36)" },
        { "offsetX": 0, "offsetY": 1, "blur": 2, "color": "rgba(0, 0, 0, 0.24)" }
      ],
      "highlight": {
        "offsetX": 0,
        "offsetY": 0.5,
        "blur": 0,
        "spread": 0,
        "color": "rgba(255, 255, 255, 0.1)",
        "inset": true
      },
      "navBarRadiusPx": 28,
      "navShadowUp": { "offsetX": 0, "offsetY": -4, "blur": 32, "color": "rgba(0, 0, 0, 0.32)" }
    }
  },
  "layout": {
    "contentMaxWidth": 768,
    "contentMaxWidthMd": 672,
    "contentMaxWidthWide": 1024,
    "sheetMaxWidth": 576,
    "pagePaddingX": 20,
    "pagePaddingXSm": 40,
    "pagePaddingXLg": 64,
    "nativeNavBarHeight": 60,
    "nativeNavInsetMin": 10
  },
  "radius": {
    "base": 16,
    "sm": 12,
    "md": 14,
    "lg": 16,
    "xl": 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
    "sheetCard": 28,
    "sheetInset": 20,
    "pill": 999
  },
  "spacing": {
    "gridUnit": 8,
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32,
    "2xl": 48,
    "3xl": 64,
    "4xl": 96
  },
  "touch": {
    "minTarget": 44,
    "pressScale": 0.97,
    "pressDurationMs": 120,
    "pressCurve": [0.25, 0.1, 0.25, 1]
  },
  "typography": {
    "fontSans": "Inter",
    "fontSerif": "Source Serif 4",
    "weights": {
      "display": 300,
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "wordmark": 600
    },
    "sizes": {
      "labelSmall": 11,
      "labelEyebrow": 12,
      "bodySerif": 17
    },
    "letterSpacing": {
      "labelEyebrow": 0.1,
      "labelSmall": 0.04,
      "wordmark": 0.45,
      "numericDisplay": -0.02
    },
    "lineHeights": {
      "bodySerif": 1.5,
      "numericDisplay": 1
    }
  }
}
''';
