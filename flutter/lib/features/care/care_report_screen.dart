import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';

/// Read-only caregiver report detail — mirror of web
/// `care.$ownerId.reports.$reportId.tsx` (`caregiverReadReport`).
///
/// HONEST GAP STATE (backend-blocked):
/// The web route reads the report through the scope-guarded server function
/// `caregiverReadReport` (care.functions.ts:1323). That function runs on
/// `supabaseAdmin` behind `assertScope('reports:read')` and — critically —
/// writes a `phi_access_log { action: 'caregiver_view' }` audit row as a side
/// effect. Flutter has no server-fn client, and RLS blocks a caregiver from
/// reading another user's `report_documents` / `report_metrics` directly, so
/// there is no RLS-safe client path that also preserves the mandatory PHI
/// audit write. We therefore render an honest "access being enabled" state
/// rather than fabricating a report or bypassing RLS.
///
/// Server route needed to make this real:
///   `caregiverReadReport { owner_id, report_id }` exposed as a Worker route
///   (e.g. POST /api/care/report), preserving `assertScope('reports:read')`
///   and the `phi_access_log action:caregiver_view` write.
class CareReportScreen extends StatelessWidget {
  const CareReportScreen({
    super.key,
    required this.ownerId,
    required this.reportId,
  });

  final String ownerId;
  final String reportId;

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go('/care/$ownerId'),
                icon: Icon(
                  Icons.arrow_back,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
                label: Text(
                  'Back to care view',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                ),
                style: TextButton.styleFrom(
                  minimumSize: const Size(0, 44),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'CARE · REPORT',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Report',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontFamily: PurpleType.serif,
                      height: 1.04,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 24),
              const EmptyState(
                eyebrow: 'Read-only',
                title: 'Caregiver report view is being enabled',
                body:
                    'Viewing a shared lab report here needs scope-checked access '
                    'that also records the required privacy audit. That secure '
                    'access is being turned on. For now, open this report on the '
                    'Purple web app, where read-only caregiver viewing is '
                    'available.',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
