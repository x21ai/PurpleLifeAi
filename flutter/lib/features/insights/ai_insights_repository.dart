import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/worker_client.dart';
import '../../core/providers/core_providers.dart';
import '../reports/models/report_ai_summary.dart';

/// One "For you" card, mirrors web `getDailyInsightCards` card shape.
class DailyInsightCard {
  const DailyInsightCard({
    required this.title,
    required this.body,
    this.tone,
    this.metricKey,
  });

  final String title;
  final String body;

  /// One of "info" | "watch" | "attention".
  final String? tone;
  final String? metricKey;

  factory DailyInsightCard.fromMap(Map<String, dynamic> map) {
    return DailyInsightCard(
      title: (map['title'] as String?) ?? '',
      body: (map['body'] as String?) ?? '',
      tone: map['tone'] as String?,
      metricKey: map['metricKey'] as String?,
    );
  }
}

/// Result of `/api/ai/daily-insight-cards`, mirrors web `getDailyInsightCards`.
class DailyInsightCardsResult {
  const DailyInsightCardsResult({
    required this.cards,
    this.headline,
    required this.cached,
    this.error,
  });

  final List<DailyInsightCard> cards;
  final String? headline;
  final bool cached;
  final String? error;

  static const empty = DailyInsightCardsResult(cards: [], cached: false);

  factory DailyInsightCardsResult.fromMap(Map<String, dynamic> map) {
    return DailyInsightCardsResult(
      cards: ((map['cards'] as List?) ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(DailyInsightCard.fromMap)
          .toList(),
      headline: map['headline'] as String?,
      cached: (map['cached'] as bool?) ?? false,
      error: map['error'] as String?,
    );
  }
}

/// Result of `/api/ai/metric-insight`, mirrors web `getMetricInsight`.
class MetricInsightResult {
  const MetricInsightResult({
    this.summary,
    required this.bullets,
    required this.suggestedQuestions,
    this.error,
    required this.cached,
    this.latestAt,
  });

  final String? summary;
  final List<String> bullets;
  final List<String> suggestedQuestions;

  /// Null on success. `"not_enough_data"` | `"AI unavailable"` |
  /// `"rate_limited"` | `"credits_exhausted"` | other message on failure.
  final String? error;
  final bool cached;
  final String? latestAt;

  bool get hasContent => summary != null && summary!.trim().isNotEmpty;

  static const empty = MetricInsightResult(
    bullets: [],
    suggestedQuestions: [],
    cached: false,
  );

  factory MetricInsightResult.fromMap(Map<String, dynamic> map) {
    return MetricInsightResult(
      summary: map['summary'] as String?,
      bullets: ((map['bullets'] as List?) ?? const [])
          .whereType<String>()
          .toList(),
      suggestedQuestions: ((map['suggestedQuestions'] as List?) ?? const [])
          .whereType<String>()
          .toList(),
      error: map['error'] as String?,
      cached: (map['cached'] as bool?) ?? false,
      latestAt: map['latestAt'] as String?,
    );
  }
}

/// Result of `/api/ai/summarize-report`, mirrors web `summarizeReport`.
class ReportSummaryResult {
  const ReportSummaryResult({required this.cached, required this.summary});

  final bool cached;
  final ReportAiSummary summary;

  factory ReportSummaryResult.fromMap(Map<String, dynamic> map) {
    return ReportSummaryResult(
      cached: (map['cached'] as bool?) ?? false,
      summary: ReportAiSummary.fromMap(
        Map<String, dynamic>.from(map['summary'] as Map),
      ),
    );
  }
}

/// Thin wrapper over [WorkerClient] for the three on-demand AI endpoints
/// (`/api/ai/*`) fronting the web `summarizeReport`, `getMetricInsight`, and
/// `getDailyInsightCards` server fns. See `docs/OPEN-ISSUES.md`
/// `care-accept-server-route` (Insights / reports AI backlog) for context.
class AiInsightsRepository {
  AiInsightsRepository({required WorkerClient worker}) : _worker = worker;

  final WorkerClient _worker;

  /// Runs automatically once per day (server-cached under `__daily_cards__`),
  /// so callers can invoke this on screen load without a "Run AI" gate.
  Future<DailyInsightCardsResult> loadDailyCards({bool force = false}) async {
    final map = await _worker.postDailyInsightCards(force: force);
    return DailyInsightCardsResult.fromMap(map);
  }

  /// Pass `force: false` to read any cached insight without spending AI
  /// credits; pass `force: true` from an explicit "Run AI insights" action.
  Future<MetricInsightResult> loadMetricInsight(
    String metricKey, {
    bool force = false,
  }) async {
    final map = await _worker.postMetricInsight(
      metricKey: metricKey,
      force: force,
    );
    return MetricInsightResult.fromMap(map);
  }

  /// Pass `force: true` to re-run an already-cached explanation.
  Future<ReportSummaryResult> summarizeReport(
    String reportId, {
    bool force = false,
  }) async {
    final map = await _worker.postSummarizeReport(
      reportId: reportId,
      force: force,
    );
    return ReportSummaryResult.fromMap(map);
  }
}

final aiInsightsRepositoryProvider = Provider<AiInsightsRepository>((ref) {
  return AiInsightsRepository(worker: ref.watch(workerClientProvider));
});

/// Guard against hung Worker AI calls that leave Plan / Insights spinning.
const dailyInsightCardsTimeout = Duration(seconds: 20);

/// Auto-loads the daily "For you" cards (cached server-side per user per
/// day), mirroring the web Insights page's automatic behavior.
///
/// Fail-open: timeout or transport errors return an empty result with
/// [DailyInsightCardsResult.error] set so Protocol / Insights empty copy
/// stays honest (not "log more readings").
final dailyInsightCardsProvider =
    FutureProvider.autoDispose<DailyInsightCardsResult>((ref) async {
  ref.keepAlive();
  ref.watch(authSessionProvider);
  try {
    return await ref
        .watch(aiInsightsRepositoryProvider)
        .loadDailyCards()
        .timeout(dailyInsightCardsTimeout);
  } on TimeoutException catch (error, stack) {
    debugPrint(
      '[dailyInsightCards] timed out after '
      '${dailyInsightCardsTimeout.inSeconds}s: $error\n$stack',
    );
    return const DailyInsightCardsResult(
      cards: [],
      cached: false,
      error: 'timeout',
    );
  } catch (error, stack) {
    debugPrint('[dailyInsightCards] failed: $error\n$stack');
    return const DailyInsightCardsResult(
      cards: [],
      cached: false,
      error: 'unavailable',
    );
  }
});
