import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../auth/auth_state.dart';
import '../../../design/glass_surface.dart';
import '../../../design/purple_theme.dart';
import '../../../design/purple_type.dart';
import '../../../design/tokens.dart';
import '../../../shell/routes.dart';
import '../marketing_copy.dart';

/// Full-page marketing scaffold: glass header, scroll body, footer.
class MarketingScaffold extends ConsumerWidget {
  const MarketingScaffold({
    super.key,
    required this.body,
    this.useLightTheme = false,
  });

  final Widget body;
  final bool useLightTheme;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appearance = useLightTheme ? 'light' : 'dark';

    return Theme(
      data: useLightTheme ? buildPurpleLightTheme() : buildPurpleDarkTheme(),
      child: Scaffold(
        body: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _MarketingHeader(appearance: appearance)),
            SliverToBoxAdapter(child: body),
            const SliverToBoxAdapter(child: _MarketingFooter()),
          ],
        ),
      ),
    );
  }
}

class _MarketingHeader extends ConsumerWidget {
  const _MarketingHeader({required this.appearance});

  final String appearance;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PurpleTokens.loaded;
    final layout = tokens.layout;
    final colors = tokens.colorsFor(appearance);
    final glass = tokens.glassFor(appearance);
    final isAuthenticated = ref.watch(isAuthenticatedProvider);
    final textPrimary = parseTokenColor(colors.textPrimary);
    final textSecondary = parseTokenColor(colors.textSecondary);
    final purple = parseTokenColor(colors.purplePrimary);

    return GlassSurface(
      appearance: appearance,
      variant: GlassMaterialVariant.top,
      borderRadius: BorderRadius.zero,
      padding: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: parseTokenColor(glass.border),
              width: glass.borderWidthPx,
            ),
          ),
        ),
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: layout.contentMaxWidthWide),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: layout.pagePaddingXSm),
              child: SizedBox(
                height: 64,
                child: Row(
                  children: [
                    InkWell(
                      onTap: () => context.go(AppRoutes.marketingHome),
                      child: Text(
                        MarketingCopy.wordmark,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.45 * 14,
                          color: textPrimary,
                        ),
                      ),
                    ),
                    const Spacer(),
                    if (MediaQuery.sizeOf(context).width >= 960) ...[
                      _NavLink(
                        label: MarketingCopy.navAbout,
                        onTap: () => context.go(AppRoutes.about),
                        color: textSecondary,
                      ),
                      _NavLink(
                        label: MarketingCopy.navPricing,
                        onTap: () => context.go(AppRoutes.pricing),
                        color: textSecondary,
                      ),
                      _NavLink(
                        label: MarketingCopy.navContact,
                        onTap: () => context.go(AppRoutes.contact),
                        color: textSecondary,
                      ),
                      const SizedBox(width: 16),
                    ],
                    if (isAuthenticated)
                      FilledButton(
                        onPressed: () => context.go(AppRoutes.today),
                        style: FilledButton.styleFrom(
                          backgroundColor: purple,
                          foregroundColor: Colors.white,
                          minimumSize: const Size(0, 36),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                        ),
                        child: const Text(MarketingCopy.navOpenApp),
                      )
                    else ...[
                      TextButton(
                        onPressed: () => context.go(AppRoutes.signIn),
                        child: Text(
                          MarketingCopy.navSignIn,
                          style: TextStyle(color: textSecondary),
                        ),
                      ),
                      const SizedBox(width: 4),
                      FilledButton(
                        onPressed: () => context.go(AppRoutes.signIn),
                        style: FilledButton.styleFrom(
                          backgroundColor: purple,
                          foregroundColor: Colors.white,
                          minimumSize: const Size(0, 36),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                        ),
                        child: const Text(MarketingCopy.navGetStarted),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavLink extends StatelessWidget {
  const _NavLink({
    required this.label,
    required this.onTap,
    required this.color,
  });

  final String label;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: InkWell(
        onTap: onTap,
        child: Text(label, style: TextStyle(fontSize: 14, color: color)),
      ),
    );
  }
}

class _MarketingFooter extends StatelessWidget {
  const _MarketingFooter();

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final layout = tokens.layout;
    final colors = tokens.colorsFor('dark');
    final textSecondary = parseTokenColor(colors.textSecondary);
    final divider = parseTokenColor(colors.divider);
    final year = DateTime.now().year;

    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: divider)),
        color: parseTokenColor(colors.backgroundPrimary).withValues(alpha: 0.6),
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: layout.contentMaxWidthWide),
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: layout.pagePaddingX,
              vertical: tokens.spacing.lg,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 20,
                  runSpacing: 8,
                  children: [
                    _FooterLink(
                      label: MarketingCopy.footerTrust,
                      onTap: () => context.go(AppRoutes.trust),
                      color: textSecondary,
                    ),
                    _FooterLink(
                      label: MarketingCopy.footerPrivacy,
                      onTap: () => context.go(AppRoutes.marketingPrivacy),
                      color: textSecondary,
                    ),
                    _FooterLink(
                      label: MarketingCopy.navContact,
                      onTap: () => context.go(AppRoutes.contact),
                      color: textSecondary,
                    ),
                  ],
                ),
                SizedBox(height: tokens.spacing.md),
                Text(
                  MarketingCopy.footerCopyright.replaceAll('{year}', '$year'),
                  style: TextStyle(fontSize: 12, color: textSecondary),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FooterLink extends StatelessWidget {
  const _FooterLink({
    required this.label,
    required this.onTap,
    required this.color,
  });

  final String label;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Text(label, style: TextStyle(fontSize: 14, color: color)),
    );
  }
}

class MarketingColumn extends StatelessWidget {
  const MarketingColumn({
    super.key,
    required this.child,
    this.maxWidth,
    this.padding,
    this.centerText = false,
  });

  final Widget child;
  final double? maxWidth;
  final EdgeInsetsGeometry? padding;
  final bool centerText;

  @override
  Widget build(BuildContext context) {
    final layout = PurpleTokens.loaded.layout;
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth ?? layout.contentMaxWidth),
        child: Padding(
          padding: padding ??
              EdgeInsets.symmetric(
                horizontal: layout.pagePaddingXSm,
                vertical: layout.pagePaddingX,
              ),
          child: centerText
              ? DefaultTextStyle(
                  textAlign: TextAlign.center,
                  style: DefaultTextStyle.of(context).style,
                  child: child,
                )
              : child,
        ),
      ),
    );
  }
}

class MarketingEyebrow extends StatelessWidget {
  const MarketingEyebrow(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      textAlign: TextAlign.center,
      style: Theme.of(context).textTheme.labelLarge,
    );
  }
}

class MarketingHeadline extends StatelessWidget {
  const MarketingHeadline(
    this.text, {
    super.key,
    this.fontSize = 48,
    this.textAlign = TextAlign.center,
  });

  final String text;
  final double fontSize;
  final TextAlign textAlign;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleThemeExtension.of(context).colors;
    return Text(
      text,
      textAlign: textAlign,
      style: PurpleType.serifStyle(
        fontSize: fontSize,
        height: 1.05,
        letterSpacing: -0.02 * fontSize,
        color: parseTokenColor(colors.textPrimary),
        fontWeight: FontWeight.w400,
      ),
    );
  }
}

class MarketingBody extends StatelessWidget {
  const MarketingBody(
    this.text, {
    super.key,
    this.textAlign = TextAlign.center,
    this.fontSize = 16,
  });

  final String text;
  final TextAlign textAlign;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleThemeExtension.of(context).colors;
    return Text(
      text,
      textAlign: textAlign,
      style: TextStyle(
        fontSize: fontSize,
        height: 1.6,
        color: parseTokenColor(colors.textSecondary),
      ),
    );
  }
}

class MarketingHeroBand extends StatelessWidget {
  const MarketingHeroBand({
    super.key,
    this.eyebrow,
    required this.headline,
    this.body,
    this.actions,
    this.height = 420,
  });

  final String? eyebrow;
  final String headline;
  final String? body;
  final Widget? actions;
  final double height;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = PurpleThemeExtension.of(context).colors;
    final purpleDeep = parseTokenColor(colors.purpleDeep);
    final canvas = parseTokenColor(colors.canvas);

    return SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [purpleDeep.withValues(alpha: 0.85), canvas],
              ),
            ),
          ),
          Center(
            child: MarketingColumn(
              centerText: true,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (eyebrow != null) ...[
                    MarketingEyebrow(eyebrow!),
                    SizedBox(height: tokens.spacing.md),
                  ],
                  MarketingHeadline(headline, fontSize: 44),
                  if (body != null) ...[
                    SizedBox(height: tokens.spacing.md),
                    MarketingBody(body!, fontSize: 17),
                  ],
                  if (actions != null) ...[
                    SizedBox(height: tokens.spacing.lg),
                    actions!,
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MarketingPrimaryButton extends StatelessWidget {
  const MarketingPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, 48),
        padding: const EdgeInsets.symmetric(horizontal: 28),
      ),
      child: Text(label),
    );
  }
}
