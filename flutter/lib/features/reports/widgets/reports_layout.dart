import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shell/routes.dart';
import '../../shared/glass_helpers.dart';

enum ReportsTab { metrics, documents }

/// Shared shell for `/reports/metrics` and `/reports/documents` (web [ReportsTabs]).
class ReportsLayout extends StatelessWidget {
  const ReportsLayout({
    super.key,
    required this.activeTab,
    required this.child,
    this.showMedicalHistoryLink = false,
  });

  final ReportsTab activeTab;
  final Widget child;
  final bool showMedicalHistoryLink;

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
                  onPressed: () => context.go(AppRoutes.settings),
                  icon: Icon(
                    Icons.arrow_back,
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                  label: Text(
                    'Settings',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'REPORTS',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.2,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Labs and\nreports',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontFamily: GoogleFonts.sourceSerif4().fontFamily,
                        height: 1.02,
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Uploaded lab PDFs and extracted metrics. Educational only, not medical advice.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.65),
                        height: 1.5,
                      ),
                ),
                const SizedBox(height: 20),
                _ReportsTabs(activeTab: activeTab),
                if (showMedicalHistoryLink) ...[
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => context.go(AppRoutes.reportsMedicalHistory),
                    child: Text(
                      'Medical history PDFs',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.65),
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                child,
              ],
            ),
        ),
      ),
    );
  }
}

class _ReportsTabs extends StatelessWidget {
  const _ReportsTabs({required this.activeTab});

  final ReportsTab activeTab;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      borderRadius: 999,
      padding: const EdgeInsets.all(4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _TabChip(
            label: 'Metrics',
            selected: activeTab == ReportsTab.metrics,
            onTap: () => context.go(AppRoutes.reportsMetrics),
          ),
          _TabChip(
            label: 'Reports',
            selected: activeTab == ReportsTab.documents,
            onTap: () => context.go(AppRoutes.reportsDocuments),
          ),
        ],
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? Colors.white.withValues(alpha: 0.14)
          : Colors.transparent,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: selected
                      ? Colors.white.withValues(alpha: 0.95)
                      : Colors.white.withValues(alpha: 0.65),
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                ),
          ),
        ),
      ),
    );
  }
}
