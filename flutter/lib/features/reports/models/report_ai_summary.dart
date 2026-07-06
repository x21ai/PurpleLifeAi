/// Plain-English AI report explanation, mirroring the shape written by web
/// `summarizeReport` (`src/lib/reports.functions.ts`) to
/// `report_documents.ai_summary` (jsonb) and returned by the Flutter-facing
/// `/api/ai/summarize-report` Worker route.
class ReportAiSummary {
  const ReportAiSummary({
    required this.headline,
    required this.explanation,
    required this.flagged,
    required this.questions,
  });

  final String headline;
  final String explanation;
  final List<FlaggedMetric> flagged;
  final List<String> questions;

  /// Plain-text body for list/detail cards (headline + explanation).
  String get displayText {
    final parts = <String>[
      if (headline.trim().isNotEmpty) headline.trim(),
      if (explanation.trim().isNotEmpty) explanation.trim(),
    ];
    return parts.join('\n\n');
  }

  bool get hasContent => displayText.trim().isNotEmpty;

  factory ReportAiSummary.fromMap(Map<String, dynamic> map) {
    return ReportAiSummary(
      headline: (map['headline'] as String?) ?? '',
      explanation: (map['explanation'] as String?) ?? '',
      flagged: ((map['flagged'] as List?) ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(FlaggedMetric.fromMap)
          .toList(),
      questions: ((map['questions'] as List?) ?? const [])
          .whereType<String>()
          .toList(),
    );
  }
}

class FlaggedMetric {
  const FlaggedMetric({
    required this.metric,
    required this.value,
    required this.concern,
    required this.severity,
  });

  final String metric;
  final String value;
  final String concern;

  /// One of "info" | "watch" | "attention".
  final String severity;

  factory FlaggedMetric.fromMap(Map<String, dynamic> map) {
    return FlaggedMetric(
      metric: (map['metric'] as String?) ?? '',
      value: (map['value'] as String?) ?? '',
      concern: (map['concern'] as String?) ?? '',
      severity: (map['severity'] as String?) ?? 'info',
    );
  }
}
