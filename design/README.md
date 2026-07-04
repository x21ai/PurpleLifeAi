# Purple design tokens

Single source of truth for Purple liquid glass styling across web (TanStack Start / Lovable CSS) and Flutter native.

## Flow

```text
src/styles.css (--glass-*, nav-glass, layout)
        |
        v
design/tokens.json   <-- edit here for cross-platform changes
        |
        +--> Web: map tokens back into CSS variables (manual or script, future)
        |
        +--> Flutter: flutter/lib/design/tokens.dart
                 |
                 +--> purple_theme.dart (ThemeData, dark default)
                 +--> glass_surface.dart (BackdropFilter)
                 +--> glass_card.dart, glass_nav_bar.dart (stubs)
```

## Source files

| Layer | Path | Role |
|-------|------|------|
| Web CSS | `src/styles.css` | Runtime styles for Lovable and production web |
| Memory | `mem/design/liquid-glass-tokens.md` | Rationale, iOS kit mapping, usage rules |
| Tokens JSON | `design/tokens.json` | Portable token definitions |
| Flutter loader | `flutter/lib/design/tokens.dart` | Parses JSON via `rootBundle` or embedded fallback |
| Flutter theme | `flutter/lib/design/purple_theme.dart` | `ThemeData` with dark default |
| Glass widgets | `flutter/lib/design/glass_*.dart` | Native glass primitives |

## Token groups in `tokens.json`

### Colors

Light and dark palettes extracted from `:root` and `.dark` in `src/styles.css`.

- **Dark canvas (default):** `#0a0710`
- **Brand purple:** `#5b2c82` light, `#b084d1` dark
- **Type:** `#fafafc` primary on dark

### Glass

Matches `--glass-*` custom properties:

| Variant | CSS class | Fill key | Blur key |
|---------|-----------|----------|----------|
| Regular | `.glass-surface`, `.glass-card` | `fill` | `blurPx` |
| Thick | `.glass-thick` | `fillThick` | `blurThickPx` |
| Thin | `.glass-thin`, `.glass-pill` | `fillThin` | `blurThinPx` |
| Nav | `.nav-glass-bar`, `.glass-nav` | `navFill` | `blurPx + navBlurOffsetPx` |

Also includes `saturate`, `navSaturate`, `border`, `navBorder`, shadow layers, and `fillFallback` for reduced transparency.

### Layout

| Token | px | Tailwind equivalent |
|-------|----|---------------------|
| `contentMaxWidth` | 768 | `max-w-3xl` |
| `contentMaxWidthMd` | 672 | `max-w-2xl` |
| `contentMaxWidthWide` | 1024 | `max-w-5xl` |
| `sheetMaxWidth` | 576 | `max-w-xl` (SheetColumn) |

Page horizontal padding mirrors `px-5 sm:px-10 lg:px-16`.

### Spacing

8pt grid from `--space-xs` through `--space-4xl` (4, 8, 16, 24, 32, 48, 64, 96).

### Touch

- `minTarget`: 44 (matches `min-h-11` controls and Apple HIG)
- `pressScale`: 0.97 (`.glass-press:active`)

### Typography

Inter sans and Source Serif 4. Weights: display 300, regular 400, medium 500, semibold 600.

## Flutter usage

```dart
import 'package:purple_design/design/purple_theme.dart';
import 'package:purple_design/design/tokens.dart';
import 'package:purple_design/design/glass_card.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final tokens = await PurpleTokens.load();
  runApp(MaterialApp(
    theme: PurpleTheme.dark(tokens: tokens),
    home: GlassCard(child: Text('Hello')),
  ));
}
```

Register the JSON asset in `flutter/pubspec.yaml`:

```yaml
flutter:
  assets:
    - assets/design/tokens.json
```

Copy or symlink `design/tokens.json` into `flutter/assets/design/`. If the asset is missing, `PurpleTokens.load()` falls back to the embedded copy in `tokens.dart`.

## Rules (from `mem/design/liquid-glass-tokens.md`)

1. Apply glass on navigation and floating controls only, not full content backgrounds.
2. Do not stack glass on glass; use opaque fills for overlays.
3. Respect reduced transparency: use `fillFallback` when backdrop blur is unavailable.
4. Dark is the hero appearance; light tokens exist for Journal, Patterns, and Settings surfaces.

## Updating tokens

1. Change values in `design/tokens.json`.
2. Sync matching `--glass-*` / color vars in `src/styles.css` (web parity).
3. Regenerate or update the embedded JSON block in `flutter/lib/design/tokens.dart` (or rely on asset load only).
4. Note the change in `mem/design/liquid-glass-tokens.md` if the decision is non-obvious.

## Related docs

- `mem/design/liquid-glass-tokens.md`
- `src/styles.css` (`.glass-*`, `.nav-glass-*`, `.sheet-canvas`)
- `src/components/layout/app-page.tsx` (content width caps)
