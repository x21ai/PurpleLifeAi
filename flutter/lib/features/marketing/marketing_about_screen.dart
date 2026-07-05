import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import 'marketing_copy.dart';
import 'widgets/marketing_layout.dart';

class MarketingAboutScreen extends StatelessWidget {
  const MarketingAboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return MarketingScaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const MarketingHeroBand(
            eyebrow: MarketingCopy.aboutEyebrow,
            headline: MarketingCopy.aboutHeadline,
          ),
          MarketingColumn(
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x3,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const MarketingEyebrow(MarketingCopy.aboutWhyEyebrow),
                SizedBox(height: tokens.spacing.md),
                const MarketingHeadline(
                  MarketingCopy.aboutWhyTitle,
                  fontSize: 36,
                  textAlign: TextAlign.start,
                ),
                SizedBox(height: tokens.spacing.lg),
                const MarketingBody(MarketingCopy.aboutWhyP1, textAlign: TextAlign.start),
                SizedBox(height: tokens.spacing.lg),
                const MarketingBody(MarketingCopy.aboutWhyP2, textAlign: TextAlign.start),
              ],
            ),
          ),
          const _QuoteBlock(
            quote: MarketingCopy.aboutQuote,
            attribution: MarketingCopy.aboutQuoteAttribution,
          ),
          const _StatBand(
            stat: MarketingCopy.aboutStat,
            caption: MarketingCopy.aboutStatCaption,
          ),
          const _QuoteBlock(
            quote: MarketingCopy.aboutCaregiverQuote,
            attribution: MarketingCopy.aboutCaregiverAttribution,
          ),
          MarketingColumn(
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x3,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const MarketingEyebrow(MarketingCopy.aboutPromisesEyebrow),
                SizedBox(height: tokens.spacing.lg),
                for (final promise in MarketingCopy.aboutPromises)
                  Padding(
                    padding: EdgeInsets.only(bottom: tokens.spacing.lg),
                    child: RichText(
                      text: TextSpan(
                        style: DefaultTextStyle.of(context).style.copyWith(
                              fontSize: 17,
                              height: 1.6,
                            ),
                        children: [
                          TextSpan(
                            text: '${promise.$1} ',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          TextSpan(text: promise.$2),
                        ],
                      ),
                    ),
                  ),
                TextButton(
                  onPressed: () => context.go(AppRoutes.trust),
                  child: const Text('Read why Purple is different'),
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
                const MarketingHeadline(MarketingCopy.aboutBandHeadline, fontSize: 36),
                SizedBox(height: tokens.spacing.md),
                const MarketingBody(MarketingCopy.aboutBandBody, fontSize: 17),
              ],
            ),
          ),
          MarketingColumn(
            centerText: true,
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x4,
            ),
            child: Column(
              children: [
                const MarketingHeadline(MarketingCopy.homeFinalHeadline, fontSize: 40),
                SizedBox(height: tokens.spacing.lg),
                MarketingPrimaryButton(
                  label: MarketingCopy.homeFinalCta,
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
          MarketingHeadline(stat, fontSize: 32),
          SizedBox(height: tokens.spacing.md),
          MarketingBody(caption, fontSize: 16),
        ],
      ),
    );
  }
}
