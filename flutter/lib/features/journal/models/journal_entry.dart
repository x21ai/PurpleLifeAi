/// Journal entry parsed from Supabase / Drift cache JSON.
class JournalEntry {
  const JournalEntry({
    required this.id,
    required this.capturedAt,
    this.text,
    this.voiceTranscript,
    this.kind = 'text',
    this.status = 'ready',
    this.aiSummary,
    this.archivedAt,
    this.mediaUrls = const [],
    this.pendingUpload = false,
  });

  final String id;
  final DateTime capturedAt;
  final String? text;
  final String? voiceTranscript;
  final String kind;
  final String status;
  final String? aiSummary;
  final DateTime? archivedAt;
  final List<String> mediaUrls;
  final bool pendingUpload;

  bool get isArchived => archivedAt != null;

  String get preview {
    final body = (text ?? voiceTranscript ?? aiSummary ?? '').trim();
    if (body.isEmpty) return 'Entry with no text';
    return body.length > 160 ? '${body.substring(0, 160)}…' : body;
  }

  factory JournalEntry.fromJson(
    Map<String, dynamic> json, {
    bool pendingUpload = false,
  }) {
    final mediaRaw = json['media_urls'];
    return JournalEntry(
      id: json['id'] as String,
      capturedAt: DateTime.parse(
        (json['captured_at'] ?? json['created_at']) as String,
      ),
      text: json['text'] as String?,
      voiceTranscript: json['voice_transcript'] as String?,
      kind: json['kind'] as String? ?? 'text',
      status: json['status'] as String? ?? 'ready',
      aiSummary: json['ai_summary'] as String?,
      archivedAt: json['archived_at'] == null
          ? null
          : DateTime.tryParse(json['archived_at'] as String),
      mediaUrls: mediaRaw is List
          ? mediaRaw.map((e) => e.toString()).toList()
          : const [],
      pendingUpload: pendingUpload,
    );
  }
}
