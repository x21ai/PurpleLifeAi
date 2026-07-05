import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';

/// In-app privacy copy from web `settings.privacy.tsx`.
class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 16, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: IconButton(
                        onPressed: () => context.go(AppRoutes.settings),
                        icon: const Icon(Icons.close_rounded, size: 20),
                        color: Colors.white.withValues(alpha: 0.6),
                        tooltip: 'Close',
                        constraints:
                            const BoxConstraints(minWidth: 44, minHeight: 44),
                      ),
                    ),
                    Text(
                      'Privacy & safety',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.95),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const _PrivacyCard(
                title: 'What we collect',
                body:
                    "Only what you put in or explicitly connect: your journal "
                    'entries (text, voice transcripts, photos), medications and '
                    'doses, seizures and other events, biometrics from devices '
                    'you choose to link (Oura, WHOOP, Apple Health), and basic '
                    'account info (email, optional name, region, preferred language).\n\n'
                    "We don't track you across the web. There are no third-party "
                    'advertising or analytics trackers in Purple.',
              ),
              const SizedBox(height: 12),
              const _PrivacyCard(
                title: 'How AI is used',
                body:
                    'Purple uses language models to help you write, transcribe '
                    'voice notes, extract structured details from your entries, '
                    'and answer questions about your own data. Requests are made '
                    'on your behalf to model providers via a secured gateway. '
                    'Your content is sent only to fulfill that request. It is not '
                    'used to train third-party models.',
              ),
              const SizedBox(height: 12),
              const _PrivacyCard(
                title: 'Who can see your data',
                body:
                    'By default, only you. Caregivers and family members you invite '
                    'get read-only access to the scopes you choose. If a caregiver '
                    'tries to write on your behalf, you get a notice and the change '
                    'waits for your approval.\n\n'
                    'Shared medical reports use one-time signed links that you can '
                    'revoke at any time.',
              ),
              const SizedBox(height: 12),
              const _PrivacyCard(
                title: "Where it's stored",
                body:
                    'On managed cloud infrastructure (Supabase / PostgreSQL), '
                    'encrypted in transit and at rest. Uploaded files (voice clips, '
                    'photos, reports) live in private storage buckets and are served '
                    'through short-lived signed URLs, never public links.',
              ),
              const SizedBox(height: 12),
              const _PrivacyCard(
                title: 'Export and delete',
                body:
                    'Open Settings → Data to export everything, or to delete your '
                    'account. Deletion removes your journal, medications, biometrics, '
                    'devices, sharing relationships, and uploaded files. Backups are '
                    'purged on a rolling schedule.',
              ),
              const SizedBox(height: 12),
              const _PrivacyCard(
                title: "What we'll never do",
                body:
                    '• Sell, rent, or share your data with brokers or advertisers.\n'
                    '• Use your journal or biometrics to target ads.\n'
                    '• Train AI models on your data without your explicit, opt-in '
                    'consent.\n'
                    '• Ship third-party trackers, behavioral analytics, or '
                    'session-replay tools.\n'
                    '• Lock you in. Your data is exportable and deletable at any '
                    'time.',
              ),
              const SizedBox(height: 12),
              const _PrivacyCard(
                title: 'Children',
                body:
                    'Purple is not directed at children under 13. Parents and '
                    "caregivers may use Purple to track a minor's health on their "
                    'own account, but accounts must be created and managed by an '
                    'adult.',
              ),
              const SizedBox(height: 12),
              _PrivacyCard(
                title: 'Questions',
                body: 'Reach us at hello@purplelife.org.',
                trailing: TextButton(
                  onPressed: () async {
                    final uri = Uri.parse('mailto:hello@purplelife.org');
                    await launchUrl(uri);
                  },
                  child: const Text('Email hello@purplelife.org'),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Last updated: June 2026.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PrivacyCard extends StatelessWidget {
  const _PrivacyCard({
    required this.title,
    required this.body,
    this.trailing,
  });

  final String title;
  final String body;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontFamily: PurpleType.serif,
                  color: Colors.white.withValues(alpha: 0.95),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.7),
                  height: 1.5,
                ),
          ),
          if (trailing != null) ...[
            const SizedBox(height: 12),
            trailing!,
          ],
        ],
      ),
    );
  }
}
