import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import 'marketing_copy.dart';
import 'widgets/marketing_layout.dart';

class MarketingPricingScreen extends StatefulWidget {
  const MarketingPricingScreen({super.key});

  @override
  State<MarketingPricingScreen> createState() => _MarketingPricingScreenState();
}

class _MarketingPricingScreenState extends State<MarketingPricingScreen> {
  bool _yearly = true;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return MarketingScaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          MarketingColumn(
            centerText: true,
            padding: EdgeInsets.only(
              top: tokens.spacing.x4,
              bottom: tokens.spacing.x2,
              left: tokens.layout.pagePaddingXSm,
              right: tokens.layout.pagePaddingXSm,
            ),
            child: Column(
              children: [
                const MarketingEyebrow(MarketingCopy.pricingEyebrow),
                SizedBox(height: tokens.spacing.md),
                const MarketingHeadline(MarketingCopy.pricingHeadline, fontSize: 48),
                SizedBox(height: tokens.spacing.md),
                const MarketingBody(MarketingCopy.pricingIntro, fontSize: 17),
                SizedBox(height: tokens.spacing.lg),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
                  ),
                  child: Text(
                    MarketingCopy.pricingBanner,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
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
            child: Column(
              children: [
                _IntervalToggle(
                  yearly: _yearly,
                  onChanged: (yearly) => setState(() => _yearly = yearly),
                ),
                SizedBox(height: tokens.spacing.x2),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isWide = constraints.maxWidth >= 720;
                    final cards = [
                      _PlanCard(
                        label: MarketingCopy.pricingFreeLabel,
                        price: MarketingCopy.pricingFreePrice,
                        sub: MarketingCopy.pricingFreeSub,
                        features: MarketingCopy.freeFeatures,
                        cta: MarketingCopy.pricingFreeCta,
                        onCta: () => context.go(AppRoutes.signIn),
                        highlighted: false,
                      ),
                      _PlanCard(
                        label: MarketingCopy.pricingProLabel,
                        price: _yearly
                            ? MarketingCopy.pricingProYearly
                            : MarketingCopy.pricingProMonthly,
                        sub: _yearly
                            ? MarketingCopy.pricingProYearlySub
                            : MarketingCopy.pricingProMonthlySub,
                        features: MarketingCopy.proFeatures,
                        cta: MarketingCopy.pricingProCurrent,
                        onCta: null,
                        highlighted: true,
                      ),
                    ];
                    if (isWide) {
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: cards[0]),
                          SizedBox(width: tokens.spacing.x2),
                          Expanded(child: cards[1]),
                        ],
                      );
                    }
                    return Column(
                      children: [
                        cards[0],
                        SizedBox(height: tokens.spacing.x2),
                        cards[1],
                      ],
                    );
                  },
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const MarketingHeadline(
                  MarketingCopy.pricingFaqTitle,
                  fontSize: 32,
                  textAlign: TextAlign.start,
                ),
                SizedBox(height: tokens.spacing.lg),
                for (final faq in MarketingCopy.pricingFaqs)
                  _FaqTile(question: faq.q, answer: faq.a),
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
                const MarketingHeadline(MarketingCopy.pricingCtaTitle, fontSize: 36),
                SizedBox(height: tokens.spacing.md),
                const MarketingBody(MarketingCopy.pricingCtaSub, fontSize: 14),
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

class _IntervalToggle extends StatelessWidget {
  const _IntervalToggle({required this.yearly, required this.onChanged});

  final bool yearly;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _ToggleChip(
                label: 'Monthly',
                selected: !yearly,
                onTap: () => onChanged(false),
              ),
              _ToggleChip(
                label: 'Yearly',
                selected: yearly,
                onTap: () => onChanged(true),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ToggleChip extends StatelessWidget {
  const _ToggleChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          color: selected ? Theme.of(context).colorScheme.onSurface : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: selected
                ? Theme.of(context).colorScheme.surface
                : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.label,
    required this.price,
    required this.sub,
    required this.features,
    required this.cta,
    required this.onCta,
    required this.highlighted,
  });

  final String label;
  final String price;
  final String sub;
  final List<String> features;
  final String cta;
  final VoidCallback? onCta;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    return Container(
      padding: EdgeInsets.all(tokens.spacing.x2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: highlighted
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).dividerColor,
          width: highlighted ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MarketingEyebrow(label),
          SizedBox(height: tokens.spacing.md),
          MarketingHeadline(price, fontSize: 56, textAlign: TextAlign.start),
          SizedBox(height: tokens.spacing.sm),
          MarketingBody(sub, fontSize: 14, textAlign: TextAlign.start),
          SizedBox(height: tokens.spacing.lg),
          SizedBox(
            width: double.infinity,
            child: onCta == null
                ? FilledButton(onPressed: null, child: Text(cta))
                : OutlinedButton(onPressed: onCta, child: Text(cta)),
          ),
          SizedBox(height: tokens.spacing.lg),
          for (final feature in features) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.check,
                  size: 16,
                  color: highlighted
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(feature, style: const TextStyle(fontSize: 14, height: 1.5)),
                ),
              ],
            ),
            SizedBox(height: tokens.spacing.sm),
          ],
        ],
      ),
    );
  }
}

class _FaqTile extends StatelessWidget {
  const _FaqTile({required this.question, required this.answer});

  final String question;
  final String answer;

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      title: Text(question, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(answer, style: const TextStyle(fontSize: 14, height: 1.6)),
          ),
        ),
      ],
    );
  }
}
