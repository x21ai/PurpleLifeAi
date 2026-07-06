import 'package:flutter/material.dart';

import '../data_style.dart';

/// Retry card when the Data tab cannot load or times out.
class DataLoadErrorCard extends StatelessWidget {
  const DataLoadErrorCard({
    super.key,
    required this.onRetry,
    this.title = 'Could not load your data',
    this.body = 'Pull to refresh or retry.',
  });

  final VoidCallback onRetry;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    return DataCardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: dataSans(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              color: p.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: dataSans(fontSize: 13, color: p.textTertiary),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: onRetry,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

/// Inline banner when some Data tab queries fail but partial rows loaded.
class DataPartialLoadBanner extends StatelessWidget {
  const DataPartialLoadBanner({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    return DataCardShell(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, size: 18, color: p.info),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: dataSans(fontSize: 13, height: 1.4, color: p.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}
