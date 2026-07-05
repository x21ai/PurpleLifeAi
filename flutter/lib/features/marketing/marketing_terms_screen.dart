import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import 'marketing_copy.dart';
import 'widgets/marketing_layout.dart';

class MarketingTermsScreen extends StatelessWidget {
  const MarketingTermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return MarketingScaffold(
      useLightTheme: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          MarketingColumn(
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x3,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const MarketingEyebrow(MarketingCopy.termsEyebrow),
                SizedBox(height: tokens.spacing.md),
                const MarketingHeadline(
                  MarketingCopy.termsHeadline,
                  fontSize: 48,
                  textAlign: TextAlign.start,
                ),
                SizedBox(height: tokens.spacing.lg),
                for (final paragraph in MarketingCopy.termsParagraphs) ...[
                  MarketingBody(paragraph, textAlign: TextAlign.start, fontSize: 17),
                  SizedBox(height: tokens.spacing.lg),
                ],
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 4,
                  children: [
                    const MarketingBody(
                      'See also our',
                      textAlign: TextAlign.start,
                      fontSize: 17,
                    ),
                    TextButton(
                      onPressed: () => context.go(AppRoutes.marketingPrivacy),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text('privacy & safety'),
                    ),
                    const MarketingBody(
                      'page and our',
                      textAlign: TextAlign.start,
                      fontSize: 17,
                    ),
                    TextButton(
                      onPressed: () => context.go(AppRoutes.charter),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text('founding charter'),
                    ),
                    const MarketingBody('.', textAlign: TextAlign.start, fontSize: 17),
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
