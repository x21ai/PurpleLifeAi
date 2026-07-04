import 'package:flutter/material.dart';

import 'settings_screen.dart';

/// Placeholder for settings sub-routes not yet fully ported.
class SettingsPlaceholderScreen extends StatelessWidget {
  const SettingsPlaceholderScreen({
    super.key,
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return SettingsHubLayout(
      hub: 'settings',
      title: title,
      body: body,
    );
  }
}

/// Sharing settings placeholder.
class SharingScreen extends StatelessWidget {
  const SharingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const SettingsPlaceholderScreen(
      title: 'Sharing',
      body:
          'Invite caregivers and manage what they can see. Full caregiver flows ship in a later phase.',
    );
  }
}
