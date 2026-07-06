import 'package:flutter/material.dart';

import '../shared/glass_helpers.dart';
import 'chat_repository.dart';

enum ProposalStatus { pending, confirmed, cancelled, failed }

/// Confirmable card for a Purple-proposed write action (mirrors web
/// `ActionConfirmCard`). Confirm executes the action; Cancel writes nothing.
class ActionConfirmCard extends StatelessWidget {
  const ActionConfirmCard({
    super.key,
    required this.proposal,
    required this.status,
    required this.busy,
    required this.onConfirm,
    required this.onCancel,
  });

  final Proposal proposal;
  final ProposalStatus status;
  final bool busy;
  final VoidCallback onConfirm;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final entries = proposal.displayParams;

    return Align(
      alignment: Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.9,
        ),
        child: Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: GlassSurface(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            borderRadius: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        proposal.kind.label.toUpperCase(),
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              letterSpacing: 1.1,
                              color: primary,
                            ),
                      ),
                    ),
                    _statusChip(context),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  proposal.summary,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.92),
                        height: 1.4,
                      ),
                ),
                if (entries.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  for (final entry in entries)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 2),
                      child: RichText(
                        text: TextSpan(
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: Colors.white.withValues(alpha: 0.6),
                              ),
                          children: [
                            TextSpan(
                              text: '${entry.key}: ',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.8),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            TextSpan(text: entry.value),
                          ],
                        ),
                      ),
                    ),
                ],
                if (status == ProposalStatus.pending) ...[
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      FilledButton(
                        onPressed: busy ? null : onConfirm,
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(88, 44),
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                        ),
                        child: busy
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Confirm'),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: busy ? null : onCancel,
                        style: TextButton.styleFrom(
                          minimumSize: const Size(64, 44),
                          foregroundColor: Colors.white.withValues(alpha: 0.7),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _statusChip(BuildContext context) {
    switch (status) {
      case ProposalStatus.confirmed:
        return Text(
          'Done',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.85),
              ),
        );
      case ProposalStatus.cancelled:
        return Text(
          'Cancelled',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.5),
              ),
        );
      case ProposalStatus.failed:
        return Text(
          'Failed',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Theme.of(context).colorScheme.error,
              ),
        );
      case ProposalStatus.pending:
        return const SizedBox.shrink();
    }
  }
}
