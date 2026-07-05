import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import 'marketing_copy.dart';
import 'widgets/marketing_layout.dart';

/// Marketing privacy page (not settings privacy).
class MarketingPrivacyScreen extends StatelessWidget {
  const MarketingPrivacyScreen({super.key});

  static const _sections = [
    (
      title: 'What we collect',
      body:
          'Only what you put in or explicitly connect: your journal entries (text, voice transcripts, photos), medications and doses, seizures and other events, biometrics from devices you choose to link (Oura, WHOOP, Apple Health), and basic account info (email, optional name, region, preferred language).\n\nWe do not track you across the web. There are no third-party advertising or analytics trackers in Purple: no Google Analytics, no pixels, no fingerprinting.',
    ),
    (
      title: 'How AI is used',
      body:
          'Purple uses language models to help you write, transcribe voice notes, extract structured details from your entries, and answer questions about your own data. Requests are made on your behalf to model providers via a secured gateway. Your content is sent only to fulfill that request. It is not used to train third-party models, and we do not train models on your data.\n\nAI suggestions are informational and never a substitute for a clinician.',
    ),
    (
      title: 'Who can see your data',
      body:
          'By default, only you. Caregivers and family members you invite get read-only access to the scopes you choose. Shared medical reports use one-time signed links that you can revoke at any time.',
    ),
    (
      title: 'Where it is stored',
      body:
          'On managed cloud infrastructure (Supabase / PostgreSQL), encrypted in transit and at rest. Uploaded files live in private storage buckets and are served through short-lived signed URLs, never public links.',
    ),
    (
      title: 'Export and delete',
      body:
          'Open Settings, Data to export everything as JSON, or to delete your account. Deletion removes your journal, medications, biometrics, devices, sharing relationships, and uploaded files.',
    ),
    (
      title: 'What we will never do',
      body:
          'Sell, rent, or share your data with brokers or advertisers. Use your journal or biometrics to target ads. Train AI models on your data without your explicit, opt-in consent. Ship third-party trackers, behavioral analytics, or session-replay tools. Lock you in. Your data is exportable and deletable at any time.',
    ),
    (
      title: 'Children',
      body:
          'Purple is not directed at children under 13. Parents and caregivers may use Purple to track a minor\'s health on their own account, but accounts must be created and managed by an adult.',
    ),
  ];

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
                const MarketingEyebrow(MarketingCopy.privacyEyebrow),
                SizedBox(height: tokens.spacing.md),
                const MarketingHeadline(
                  MarketingCopy.privacyTitle,
                  fontSize: 48,
                  textAlign: TextAlign.start,
                ),
                SizedBox(height: tokens.spacing.md),
                const MarketingBody(
                  MarketingCopy.privacyIntro,
                  textAlign: TextAlign.start,
                  fontSize: 18,
                ),
                SizedBox(height: tokens.spacing.x3),
                for (final section in _sections) ...[
                  MarketingHeadline(section.title, fontSize: 28, textAlign: TextAlign.start),
                  SizedBox(height: tokens.spacing.md),
                  MarketingBody(section.body, textAlign: TextAlign.start, fontSize: 16),
                  SizedBox(height: tokens.spacing.x2),
                ],
                const MarketingHeadline('Questions', fontSize: 28, textAlign: TextAlign.start),
                SizedBox(height: tokens.spacing.md),
                const MarketingBody(
                  'Reach us at hello@purplelife.org.',
                  textAlign: TextAlign.start,
                  fontSize: 16,
                ),
                SizedBox(height: tokens.spacing.md),
                const MarketingBody(
                  'Last updated: June 2026.',
                  textAlign: TextAlign.start,
                  fontSize: 14,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
