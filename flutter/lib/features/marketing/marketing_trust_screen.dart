import 'package:flutter/material.dart';

import '../../design/tokens.dart';
import 'marketing_copy.dart';
import 'widgets/marketing_layout.dart';

class MarketingTrustScreen extends StatelessWidget {
  const MarketingTrustScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return MarketingScaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const MarketingHeroBand(
            eyebrow: MarketingCopy.trustEyebrow,
            headline: MarketingCopy.trustHeadline,
          ),
          MarketingColumn(
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x3,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const MarketingEyebrow(MarketingCopy.trustSectionEyebrow),
                SizedBox(height: tokens.spacing.md),
                const MarketingHeadline(
                  MarketingCopy.trustSectionTitle,
                  fontSize: 36,
                  textAlign: TextAlign.start,
                ),
                SizedBox(height: tokens.spacing.lg),
                const MarketingBody(
                  MarketingCopy.trustSectionIntro,
                  textAlign: TextAlign.start,
                  fontSize: 17,
                ),
                SizedBox(height: tokens.spacing.x3),
                for (final claim in MarketingCopy.trustClaims) ...[
                  MarketingHeadline(claim.title, fontSize: 28, textAlign: TextAlign.start),
                  SizedBox(height: tokens.spacing.md),
                  MarketingBody(claim.body, textAlign: TextAlign.start, fontSize: 17),
                  SizedBox(height: tokens.spacing.x2),
                ],
                const MarketingBody(
                  'The code is at github.com/AstroAii/purpledrw. Hold us to all of it.',
                  textAlign: TextAlign.start,
                  fontSize: 17,
                ),
                SizedBox(height: tokens.spacing.x3),
                const Divider(),
                SizedBox(height: tokens.spacing.lg),
                const MarketingHeadline(
                  MarketingCopy.trustFounderName,
                  fontSize: 22,
                  textAlign: TextAlign.start,
                ),
                SizedBox(height: tokens.spacing.sm),
                const MarketingBody(
                  MarketingCopy.trustFounderRole,
                  textAlign: TextAlign.start,
                  fontSize: 14,
                ),
              ],
            ),
          ),
          MarketingColumn(
            centerText: true,
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x4,
            ),
            child: const MarketingBody(MarketingCopy.trustCharterNote, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
