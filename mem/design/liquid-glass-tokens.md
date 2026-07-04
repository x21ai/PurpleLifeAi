# Liquid Glass CSS tokens

Purple web surfaces approximate iOS 26 Liquid Glass via `--glass-*` custom properties in `src/styles.css`. Native iOS uses SwiftUI `glassEffect`; CSS cannot replicate refraction or adaptive shadows.

## Source

- **Primary:** Apple iOS & iPadOS 26 Figma Community Kit values, as documented in [ios26-design-system materials.json](https://github.com/seunghan91/ios26-design-system/blob/main/packages/tokens/src/materials.json) (extracted from kit file `pDmGXdYu2k8xlf1SQoU9PW`).
- **Figma MCP:** Authenticated 2026-07-03, but community kit file requires editor access; tokens applied from public materials spec instead.
- **iOS 27 kit** (`1651309003795292092`): same Liquid Glass model; numeric web approximations unchanged until Apple publishes new values.

## Kit parameters (regular.medium + chrome nav)

| Parameter | Kit value | CSS mapping |
|-----------|-----------|-------------|
| Fill opacity | 60% | `--glass-bg` alpha 0.6 |
| Light fill | `#f5f5f5` | `rgba(245, 245, 245, 0.6)` |
| Dark fill | `#000` @ 60% | `rgba(14, 10, 20, 0.6)` (purple undertone preserved) |
| Dark tint | white @ 6% | `--glass-border`, `--glass-highlight` |
| frostRadius (medium) | 12pt | `--glass-blur: 20px` (web scale) |
| shadowBlurLayer | 40pt | shadow spread 40px |
| Chrome nav | 75% fill, 50pt blur | `--glass-nav-bg` 0.75; nav utilities add `+8px` blur + saturate |

## Rules

- Apply `.glass-*` on navigation and floating controls only, not full content backgrounds.
- Do not stack glass on glass; use fills and vibrancy for overlays.
- `prefers-reduced-transparency`: fall back via `--glass-bg-fallback` (opaque).
