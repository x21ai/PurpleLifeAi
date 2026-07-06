# Apple system typography

Purple signed-in app chrome uses the platform system font stack, not Inter or Source Serif 4.

## Stacks

| Role | Web (`src/styles.css`) | Flutter (`purple_type.dart`) |
|------|------------------------|------------------------------|
| UI / body / labels | `--font-sans`: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif` | `.AppleSystemUIFont` on iOS/macOS, `Roboto` on Android, platform default on web |
| Large titles / greetings | `--font-serif` / `.font-display`: SF Pro Display stack (semibold at component level) | `PurpleType.serifStyle()` (defaults `FontWeight.w600`) |
| AI narrative body | `.body-serif`, `.today-lede`: `--font-sans` regular | `PurpleType.bodySerif()` |

## Rules

- Do not load Google Fonts for the signed-in app shell (`__root.tsx`, `flutter/web/index.html`).
- `PurpleType.serif` name is kept for call-site compatibility; it maps to the display/system stack, not a serif face.
- `design/tokens.json` documents `fontSans` / `fontSerif` as SF Pro Text / SF Pro Display for Lovable ↔ Flutter parity.
- Marketing routes may still use `.font-serif` / `.font-display` classes; those now resolve to SF Pro Display, not Source Serif 4.

## Related

- `mem/design/liquid-glass-tokens.md` (glass only; typography is separate)
- `flutter/lib/design/purple_theme.dart` (ThemeData uses `PurpleType.sansStyle`)
