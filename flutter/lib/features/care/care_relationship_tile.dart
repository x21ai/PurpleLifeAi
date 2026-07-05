import 'package:flutter/material.dart';

import 'care_scopes.dart';
import '../shared/glass_helpers.dart';

/// Glass list row for a care relationship.
class CareRelationshipTile extends StatelessWidget {
  const CareRelationshipTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.status,
    this.onTap,
    this.trailing,
  });

  final String title;
  final String subtitle;
  final String status;
  final VoidCallback? onTap;
  final IconData? trailing;

  @override
  Widget build(BuildContext context) {
    final role = parseCareRole(subtitle);
    final statusLabel = _statusLabel(status);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: GlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.95),
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      role != null ? careRoleLabels[role]! : subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.6),
                          ),
                    ),
                    if (statusLabel != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        statusLabel,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.45),
                            ),
                      ),
                    ],
                  ],
                ),
              ),
              Icon(
                trailing ?? Icons.chevron_right,
                color: Colors.white.withValues(alpha: onTap == null ? 0.35 : 0.55),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _statusLabel(String raw) {
    switch (raw) {
      case 'active':
        return null;
      case 'pending':
        return 'Pending';
      case 'revoked':
        return 'Revoked';
      default:
        return raw;
    }
  }
}
