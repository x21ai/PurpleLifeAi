import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';

/// In-app terms copy ported from web `settings.terms.tsx`.
class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  static const _paragraphs = <String>[
    'Purple is a personal health journal. It is not a medical device and not '
        'a substitute for professional advice, diagnosis, or treatment. In an '
        'emergency, call your local emergency number.',
    "You own your data. We don't sell it, we don't advertise against it, and "
        'you can export or delete it from Settings at any time.',
    "Use Purple honestly. Don't abuse the service, attempt to break it, or "
        "upload content that isn't yours to share. We may suspend accounts "
        'that do.',
    'The software is provided "as is" without warranty of any kind. To the '
        'extent allowed by law, the makers of Purple are not liable for '
        'damages arising from your use of it.',
  ];

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        // Bottom padding is a small buffer only: NativeAppShell already
        // reserves shellTabBarInset() worth of space for the floating nav
        // bar, so stacking another ~120px here doubled up as excess
        // whitespace (tf-bottom-whitespace).
        padding: const EdgeInsets.only(top: 16, bottom: 32),
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
                      'Terms',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.95),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              GlassSurface(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (var i = 0; i < _paragraphs.length; i++) ...[
                      if (i > 0) const SizedBox(height: 16),
                      Text(
                        _paragraphs[i],
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontFamily: PurpleType.serif,
                              color: Colors.white.withValues(alpha: 0.7),
                              height: 1.5,
                            ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => context.go(AppRoutes.settingsPrivacy),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(44, 44),
                        alignment: Alignment.centerLeft,
                      ),
                      child: const Text('See also: privacy & safety'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
