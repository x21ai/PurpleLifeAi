import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import 'marketing_copy.dart';
import 'widgets/marketing_layout.dart';

class MarketingHomeScreen extends StatelessWidget {
  const MarketingHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return MarketingScaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          MarketingHeroBand(
            eyebrow: MarketingCopy.homeEyebrow,
            headline: MarketingCopy.homeHeadline,
            body: MarketingCopy.homeBody,
            actions: Wrap(
              alignment: WrapAlignment.center,
              spacing: 12,
              runSpacing: 12,
              children: [
                MarketingPrimaryButton(
                  label: MarketingCopy.homeCtaPrimary,
                  onPressed: () => context.go(AppRoutes.signIn),
                ),
                TextButton(
                  onPressed: () {},
                  child: const Text(MarketingCopy.homeCtaSecondary),
                ),
              ],
            ),
          ),
          const _QuoteBlock(
            quote: MarketingCopy.homeQuote,
            attribution: MarketingCopy.homeQuoteAttribution,
          ),
          MarketingColumn(
            centerText: true,
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x3,
            ),
            child: Column(
              children: [
                const MarketingEyebrow(MarketingCopy.homeAudienceEyebrow),
                SizedBox(height: tokens.spacing.lg),
                const MarketingHeadline(
                  MarketingCopy.homeAudienceHeadline,
                  fontSize: 36,
                ),
                SizedBox(height: tokens.spacing.lg),
                const MarketingBody(
                  MarketingCopy.homeAudienceBody,
                  fontSize: 17,
                ),
              ],
            ),
          ),
          MarketingColumn(
            maxWidth: tokens.layout.contentMaxWidthWide,
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x2,
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth >= 720;
                final children = [
                  const _Pillar(
                    eyebrow: MarketingCopy.pillarCaptureEyebrow,
                    title: MarketingCopy.pillarCaptureTitle,
                    body: MarketingCopy.pillarCaptureBody,
                  ),
                  const _Pillar(
                    eyebrow: MarketingCopy.pillarAskEyebrow,
                    title: MarketingCopy.pillarAskTitle,
                    body: MarketingCopy.pillarAskBody,
                  ),
                  const _Pillar(
                    eyebrow: MarketingCopy.pillarTogetherEyebrow,
                    title: MarketingCopy.pillarTogetherTitle,
                    body: MarketingCopy.pillarTogetherBody,
                  ),
                ];
                if (isWide) {
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (var i = 0; i < children.length; i++) ...[
                        if (i > 0) SizedBox(width: tokens.spacing.x2),
                        Expanded(child: children[i]),
                      ],
                    ],
                  );
                }
                return Column(
                  children: [
                    for (var i = 0; i < children.length; i++) ...[
                      if (i > 0) SizedBox(height: tokens.spacing.x2),
                      children[i],
                    ],
                  ],
                );
              },
            ),
          ),
          const _StatBand(
            stat: MarketingCopy.homeStat,
            caption: MarketingCopy.homeStatCaption,
          ),
          const _QuoteBlock(
            quote: MarketingCopy.homeCaregiverQuote,
            attribution: MarketingCopy.homeCaregiverAttribution,
          ),
          MarketingColumn(
            centerText: true,
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x3,
            ),
            child: Column(
              children: [
                const MarketingHeadline(
                  MarketingCopy.homePrivacyHeadline,
                  fontSize: 32,
                ),
                SizedBox(height: tokens.spacing.md),
                const MarketingBody(
                  MarketingCopy.homePrivacyBody,
                  fontSize: 17,
                ),
              ],
            ),
          ),
          MarketingColumn(
            centerText: true,
            maxWidth: tokens.layout.contentMaxWidthMd,
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x4,
            ),
            child: Column(
              children: [
                const MarketingEyebrow(MarketingCopy.homeFinalEyebrow),
                SizedBox(height: tokens.spacing.lg),
                const MarketingHeadline(
                  MarketingCopy.homeFinalHeadline,
                  fontSize: 40,
                ),
                SizedBox(height: tokens.spacing.lg),
                const MarketingBody(
                  MarketingCopy.homeFinalBody,
                  fontSize: 17,
                ),
                SizedBox(height: tokens.spacing.x2),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    MarketingPrimaryButton(
                      label: MarketingCopy.homeFinalCta,
                      onPressed: () => context.go(AppRoutes.signIn),
                    ),
                    TextButton(
                      onPressed: () => context.go(AppRoutes.about),
                      child: const Text(MarketingCopy.homeFinalSecondary),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Pillar extends StatelessWidget {
  const _Pillar({
    required this.eyebrow,
    required this.title,
    required this.body,
  });

  final String eyebrow;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MarketingEyebrow(eyebrow),
        SizedBox(height: tokens.spacing.md),
        MarketingHeadline(title, fontSize: 28, textAlign: TextAlign.start),
        SizedBox(height: tokens.spacing.md),
        MarketingBody(body, textAlign: TextAlign.start),
      ],
    );
  }
}

class _QuoteBlock extends StatelessWidget {
  const _QuoteBlock({required this.quote, required this.attribution});

  final String quote;
  final String attribution;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    return MarketingColumn(
      centerText: true,
      padding: EdgeInsets.symmetric(
        horizontal: tokens.layout.pagePaddingXSm,
        vertical: tokens.spacing.x3,
      ),
      child: Column(
        children: [
          MarketingHeadline('"$quote"', fontSize: 28),
          SizedBox(height: tokens.spacing.md),
          MarketingBody(attribution, fontSize: 14),
        ],
      ),
    );
  }
}

class _StatBand extends StatelessWidget {
  const _StatBand({required this.stat, required this.caption});

  final String stat;
  final String caption;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    return MarketingColumn(
      centerText: true,
      padding: EdgeInsets.symmetric(
        horizontal: tokens.layout.pagePaddingXSm,
        vertical: tokens.spacing.x3,
      ),
      child: Column(
        children: [
          MarketingHeadline(stat, fontSize: 36),
          SizedBox(height: tokens.spacing.md),
          MarketingBody(caption, fontSize: 16),
        ],
      ),
    );
  }
}
