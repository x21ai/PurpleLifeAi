import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'care_repository.dart';

/// Pending care invites addressed to the signed-in user's email.
class IncomingCareInvitesCard extends ConsumerWidget {
  const IncomingCareInvitesCard({
    super.key,
    required this.invites,
    this.onChanged,
  });

  final List<IncomingCareInvite> invites;
  final VoidCallback? onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (invites.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x4DB084D1)),
        color: const Color(0x14B084D1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.volunteer_activism_outlined,
                size: 18,
                color: Colors.white.withValues(alpha: 0.85),
              ),
              const SizedBox(width: 8),
              Text(
                invites.length == 1
                    ? 'You have a care invitation'
                    : '${invites.length} care invitations',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          for (final invite in invites)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _InviteRow(
                invite: invite,
                onChanged: onChanged,
              ),
            ),
        ],
      ),
    );
  }
}

class _InviteRow extends ConsumerStatefulWidget {
  const _InviteRow({required this.invite, this.onChanged});

  final IncomingCareInvite invite;
  final VoidCallback? onChanged;

  @override
  ConsumerState<_InviteRow> createState() => _InviteRowState();
}

class _InviteRowState extends ConsumerState<_InviteRow> {
  var _busy = false;

  Future<void> _decline() async {
    setState(() => _busy = true);
    try {
      await ref.read(careRepositoryProvider).declineIncomingCareInvite(
            widget.invite.id,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invite declined')),
      );
      widget.onChanged?.call();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final invite = widget.invite;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        color: Colors.white.withValues(alpha: 0.04),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.85),
                    height: 1.45,
                  ),
              children: [
                TextSpan(
                  text: invite.ownerName,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                TextSpan(
                  text:
                      ' invited you as their ${invite.roleLabel.toLowerCase()}.',
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Accept to see what they have chosen to share with you.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              FilledButton.icon(
                onPressed: _busy
                    ? null
                    : () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Open the invite link from your email to accept.',
                            ),
                          ),
                        );
                      },
                icon: const Icon(Icons.check, size: 16),
                label: const Text('Accept'),
              ),
              OutlinedButton.icon(
                onPressed: _busy ? null : _decline,
                icon: _busy
                    ? SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white.withValues(alpha: 0.7),
                        ),
                      )
                    : const Icon(Icons.close, size: 16),
                label: const Text('Decline'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
