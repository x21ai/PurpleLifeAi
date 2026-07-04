import 'score_snapshot.dart';

/// Aggregate loaded by [TodayRepository] for the Today screen.
class TodayData {
  const TodayData({
    required this.scores,
    this.firstName,
    this.narrative,
    this.medicationCount = 0,
    this.journalEntryCount = 0,
    this.isOffline = false,
    this.loadedAt,
  });

  final ScoreSnapshot scores;
  final String? firstName;
  final String? narrative;
  final int medicationCount;
  final int journalEntryCount;
  final bool isOffline;
  final DateTime? loadedAt;

  bool get showEmptyWelcome => journalEntryCount == 0;
  bool get hasVitals => scores.hasData && buildTodayVitalItems(scores).isNotEmpty;

  static const empty = TodayData(scores: ScoreSnapshot.empty);
}
