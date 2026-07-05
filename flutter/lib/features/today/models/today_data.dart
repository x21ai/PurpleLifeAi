import 'score_snapshot.dart';

/// Latest team announcement shown in "More for today"
/// (web `admin_messages` card, `todayPage.fromTeam`).
class TodayAnnouncement {
  const TodayAnnouncement({required this.subject, required this.body});

  final String subject;
  final String body;
}

/// Aggregate loaded by [TodayRepository] for the Today screen.
class TodayData {
  const TodayData({
    required this.scores,
    this.firstName,
    this.narrative,
    this.conditions = const [],
    this.medicationCount = 0,
    this.journalEntryCount = 0,
    this.announcement,
    this.showWearablesNudge = false,
    this.isOffline = false,
    this.loadedAt,
  });

  final ScoreSnapshot scores;
  final String? firstName;
  final String? narrative;

  /// Profile `conditions` slugs for trait-driven prompts and seizure gating.
  final List<String> conditions;
  final int medicationCount;
  final int journalEntryCount;
  final TodayAnnouncement? announcement;

  /// Web `ConnectWearablesCard`: onboarded 1+ day ago and no Oura/Whoop.
  final bool showWearablesNudge;
  final bool isOffline;
  final DateTime? loadedAt;

  bool get showEmptyWelcome => journalEntryCount == 0;
  bool get hasVitals => scores.hasData && buildTodayVitalItems(scores).isNotEmpty;

  static const empty = TodayData(scores: ScoreSnapshot.empty);
}
