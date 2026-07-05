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
