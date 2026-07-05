import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import 'marketing_copy.dart';
import 'widgets/marketing_layout.dart';

class MarketingFeaturesScreen extends StatelessWidget {
  const MarketingFeaturesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return MarketingScaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const MarketingHeroBand(
            eyebrow: MarketingCopy.featuresEyebrow,
            headline: MarketingCopy.featuresHeadline,
            body: MarketingCopy.featuresIntro,
          ),
          const _FeatureSection(
            eyebrow: MarketingCopy.featuresCaptureEyebrow,
            title: MarketingCopy.featuresCaptureTitle,
            body: MarketingCopy.featuresCaptureBody,
          ),
          MarketingColumn(
            centerText: true,
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x3,
            ),
            child: Column(
              children: [
                const MarketingEyebrow(MarketingCopy.featuresAskEyebrow),
                SizedBox(height: tokens.spacing.lg),
                const MarketingHeadline(
                  MarketingCopy.featuresAskTitle,
                  fontSize: 36,
                ),
                SizedBox(height: tokens.spacing.lg),
                const MarketingBody(MarketingCopy.featuresAskBody, fontSize: 17),
                SizedBox(height: tokens.spacing.lg),
                for (final bullet in MarketingCopy.featuresAskBullets)
                  Padding(
                    padding: EdgeInsets.only(bottom: tokens.spacing.sm),
                    child: MarketingBody(bullet, fontSize: 14),
                  ),
              ],
            ),
          ),
          const _FeatureSection(
            eyebrow: MarketingCopy.featuresSeeEyebrow,
            title: MarketingCopy.featuresSeeTitle,
            body: MarketingCopy.featuresSeeBody,
          ),
          MarketingColumn(
            centerText: true,
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x3,
            ),
            child: Column(
              children: [
                MarketingHeadline(
                  '"${MarketingCopy.featuresCaregiverQuote}"',
                  fontSize: 28,
                ),
                SizedBox(height: tokens.spacing.md),
                const MarketingBody(
                  MarketingCopy.featuresCaregiverAttribution,
                  fontSize: 14,
                ),
              ],
            ),
          ),
          MarketingColumn(
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x3,
            ),
            child: Column(
              children: [
                const MarketingEyebrow(MarketingCopy.featuresRestEyebrow),
                SizedBox(height: tokens.spacing.lg),
                const MarketingHeadline(
                  MarketingCopy.featuresRestTitle,
                  fontSize: 36,
                ),
                SizedBox(height: tokens.spacing.x3),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isWide = constraints.maxWidth >= 560;
                    final items = MarketingCopy.featuresRestItems
                        .map((item) => _RestItem(title: item.title, body: item.body))
                        .toList();
                    if (!isWide) {
                      return Column(
                        children: [
                          for (var i = 0; i < items.length; i++) ...[
                            items[i],
                            if (i < items.length - 1)
                              SizedBox(height: tokens.spacing.lg),
                          ],
                        ],
                      );
                    }
                    return Wrap(
                      spacing: tokens.spacing.x2,
                      runSpacing: tokens.spacing.lg,
                      children: items
                          .map(
                            (item) => SizedBox(
                              width: (constraints.maxWidth - tokens.spacing.x2) / 2,
                              child: item,
                            ),
                          )
                          .toList(),
                    );
                  },
                ),
              ],
            ),
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
                  MarketingCopy.featuresFinalHeadline,
                  fontSize: 36,
                ),
                SizedBox(height: tokens.spacing.md),
                const MarketingBody(MarketingCopy.featuresFinalBody, fontSize: 17),
                SizedBox(height: tokens.spacing.lg),
                MarketingPrimaryButton(
                  label: MarketingCopy.featuresFinalCta,
                  onPressed: () => context.go(AppRoutes.signIn),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureSection extends StatelessWidget {
  const _FeatureSection({
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
    return MarketingColumn(
      padding: EdgeInsets.symmetric(
        horizontal: tokens.layout.pagePaddingXSm,
        vertical: tokens.spacing.x3,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MarketingEyebrow(eyebrow),
          SizedBox(height: tokens.spacing.lg),
          MarketingHeadline(title, fontSize: 36, textAlign: TextAlign.start),
          SizedBox(height: tokens.spacing.lg),
          MarketingBody(body, textAlign: TextAlign.start, fontSize: 17),
        ],
      ),
    );
  }
}

class _RestItem extends StatelessWidget {
  const _RestItem({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final divider = Theme.of(context).dividerColor;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Divider(color: divider),
        SizedBox(height: tokens.spacing.md),
        MarketingHeadline(title, fontSize: 24, textAlign: TextAlign.start),
        SizedBox(height: tokens.spacing.md),
        MarketingBody(body, textAlign: TextAlign.start, fontSize: 14),
      ],
    );
  }
}
