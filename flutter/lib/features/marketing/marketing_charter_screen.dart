import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import 'marketing_copy.dart';
import 'widgets/marketing_layout.dart';

class MarketingCharterScreen extends StatelessWidget {
  const MarketingCharterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return MarketingScaffold(
      useLightTheme: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          MarketingColumn(
            padding: EdgeInsets.only(
              top: tokens.spacing.x3,
              left: tokens.layout.pagePaddingXSm,
              right: tokens.layout.pagePaddingXSm,
            ),
            child: TextButton.icon(
              onPressed: () => context.go(AppRoutes.marketingHome),
              icon: const Icon(Icons.arrow_back, size: 18),
              label: const Text('Home'),
              style: TextButton.styleFrom(alignment: Alignment.centerLeft),
            ),
          ),
          MarketingColumn(
            padding: EdgeInsets.symmetric(
              horizontal: tokens.layout.pagePaddingXSm,
              vertical: tokens.spacing.x2,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const MarketingEyebrow(MarketingCopy.charterEyebrow),
                SizedBox(height: tokens.spacing.md),
                const MarketingHeadline(
                  MarketingCopy.charterHeadline,
                  fontSize: 48,
                  textAlign: TextAlign.start,
                ),
                SizedBox(height: tokens.spacing.md),
                const MarketingBody(
                  MarketingCopy.charterIntro,
                  textAlign: TextAlign.start,
                  fontSize: 18,
                ),
                SizedBox(height: tokens.spacing.x3),
                const _CharterSection(
                  title: MarketingCopy.charterWhoTitle,
                  paragraphs: [
                    MarketingCopy.charterWhoP1,
                    MarketingCopy.charterWhoP2,
                  ],
                ),
                const _CharterSection(
                  title: MarketingCopy.charterFeelTitle,
                  paragraphs: [
                    MarketingCopy.charterFeelP1,
                    MarketingCopy.charterFeelP2,
                  ],
                ),
                _CharterSection(
                  title: MarketingCopy.charterPromisesTitle,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (final promise in MarketingCopy.charterPromises)
                        Padding(
                          padding: EdgeInsets.only(bottom: tokens.spacing.md),
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
                    ],
                  ),
                ),
                _CharterSection(
                  title: MarketingCopy.charterWontTitle,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (final item in MarketingCopy.charterWontItems)
                        Padding(
                          padding: EdgeInsets.only(bottom: tokens.spacing.md),
                          child: MarketingBody(
                            item,
                            textAlign: TextAlign.start,
                            fontSize: 17,
                          ),
                        ),
                    ],
                  ),
                ),
                Divider(height: tokens.spacing.x3),
                const _CharterSection(
                  title: MarketingCopy.charterStandardTitle,
                  paragraphs: [MarketingCopy.charterStandardBody],
                ),
                const MarketingBody(
                  MarketingCopy.charterStandardClosing,
                  textAlign: TextAlign.start,
                  fontSize: 17,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CharterSection extends StatelessWidget {
  const _CharterSection({
    required this.title,
    this.paragraphs = const [],
    this.child,
  });

  final String title;
  final List<String> paragraphs;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    return Padding(
      padding: EdgeInsets.only(bottom: tokens.spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MarketingHeadline(title, fontSize: 28, textAlign: TextAlign.start),
          SizedBox(height: tokens.spacing.md),
          if (child != null)
            child!
          else
            for (final paragraph in paragraphs) ...[
              MarketingBody(paragraph, textAlign: TextAlign.start, fontSize: 17),
              SizedBox(height: tokens.spacing.md),
            ],
        ],
      ),
    );
  }
}
