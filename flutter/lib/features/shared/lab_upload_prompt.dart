import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';

/// Token-backed empty labs card matching the design preview and Data tab.
class LabUploadEmptyCard extends StatelessWidget {
  const LabUploadEmptyCard({
    super.key,
    required this.onUpload,
    this.title = 'No labs yet',
    this.body =
        'Upload past results to unlock biomarker trends and summary flags.',
    this.buttonLabel = 'Upload past labs',
  });

  final VoidCallback onUpload;
  final String title;
  final String body;
  final String buttonLabel;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
      decoration: BoxDecoration(
        color: parseTokenColor(colors.backgroundSecondary),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: parseTokenColor(colors.divider)),
      ),
      child: Column(
        children: [
          Text(
            '🧪',
            style: TextStyle(
              fontSize: 32,
              color: Colors.white.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: PurpleType.displayStyle(
              fontSize: 16,
              color: Colors.white.withValues(alpha: 0.95),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                  height: 1.4,
                ),
          ),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: onUpload,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(44),
              shape: const StadiumBorder(),
            ),
            child: Text(buttonLabel),
          ),
        ],
      ),
    );
  }
}

/// Primary upload CTA used on reports list screens (matches preview `.btn`).
class LabUploadButton extends StatelessWidget {
  const LabUploadButton({
    super.key,
    required this.onPressed,
    this.label = 'Upload lab report',
    this.icon = Icons.upload_file_outlined,
  });

  final VoidCallback onPressed;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(44),
        shape: const StadiumBorder(),
      ),
      icon: Icon(icon),
      label: Text(label),
    );
  }
}
