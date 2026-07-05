import '../../../core/offline/supabase_row_parse.dart';

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
    this.createdAt,
    this.archivedAt,
    this.mediaUrls = const [],
    this.aiTags = const [],
    this.aiExtracted = const {},
    this.pendingUpload = false,
  });

  final String id;
  final DateTime capturedAt;
  final DateTime? createdAt;
  final String? text;
  final String? voiceTranscript;
  final String kind;
  final String status;
  final String? aiSummary;
  final DateTime? archivedAt;
  final List<String> mediaUrls;
  final List<String> aiTags;
  final Map<String, dynamic> aiExtracted;
  final bool pendingUpload;

  bool get isArchived => archivedAt != null;

  bool get isProcessing => status == 'processing';

  bool get isFailed => status == 'failed';

  /// Web parity: a processing entry older than 5 minutes has likely stalled.
  bool get isStaleProcessing {
    if (!isProcessing) return false;
    final started = createdAt ?? capturedAt;
    return DateTime.now().toUtc().difference(started.toUtc()) >
        const Duration(minutes: 5);
  }

  /// Serialize back to Supabase row shape (used for queued cache updates).
  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'captured_at': capturedAt.toUtc().toIso8601String(),
      if (createdAt != null) 'created_at': createdAt!.toUtc().toIso8601String(),
      'text': text,
      'voice_transcript': voiceTranscript,
      'kind': kind,
      'status': status,
      'ai_summary': aiSummary,
      'archived_at': archivedAt?.toUtc().toIso8601String(),
      'media_urls': mediaUrls,
      'ai_tags': aiTags,
      'ai_extracted': aiExtracted,
    };
  }

  String get preview {
    final body = (text ?? voiceTranscript ?? aiSummary ?? '').trim();
    if (body.isEmpty) return 'Entry with no text';
    return body.length > 160 ? '${body.substring(0, 160)}…' : body;
  }

  factory JournalEntry.fromJson(
    Map<String, dynamic> json, {
    bool pendingUpload = false,
  }) {
    return JournalEntry(
      id: _requireString(json['id'], field: 'id'),
      capturedAt: _parseTimestamp(
        json['captured_at'] ?? json['created_at'],
        field: 'captured_at',
      ),
      text: _readString(json['text']),
      voiceTranscript: _readString(json['voice_transcript']),
      kind: _readString(json['kind']) ?? 'text',
      status: _readString(json['status']) ?? 'ready',
      aiSummary: _readString(json['ai_summary']),
      createdAt: _parseOptionalTimestamp(json['created_at']),
      archivedAt: _parseOptionalTimestamp(json['archived_at']),
      mediaUrls: _readStringList(json['media_urls']),
      aiTags: _readStringList(json['ai_tags']),
      aiExtracted: json['ai_extracted'] is Map
          ? Map<String, dynamic>.from(json['ai_extracted'] as Map)
          : const {},
      pendingUpload: pendingUpload,
    );
  }

  static String? _readString(Object? raw) {
    if (raw == null) return null;
    if (raw is String) {
      final trimmed = raw.trim();
      return trimmed.isEmpty ? null : trimmed;
    }
    final asString = raw.toString().trim();
    return asString.isEmpty ? null : asString;
  }

  static String _requireString(Object? raw, {required String field}) {
    final value = _readString(raw);
    if (value == null || value.isEmpty) {
      throw FormatException('Missing $field');
    }
    return value;
  }

  static List<String> _readStringList(Object? raw) {
    if (raw == null) return const [];
    if (raw is List) {
      return raw
          .map((value) => _readString(value))
          .whereType<String>()
          .where((value) => value.isNotEmpty)
          .toList();
    }
    if (raw is String && raw.trim().isNotEmpty) {
      return [raw.trim()];
    }
    return const [];
  }

  static DateTime _parseTimestamp(Object? raw, {required String field}) {
    final parsed = parseSupabaseDateTime(raw);
    if (parsed == null) {
      throw FormatException('Missing $field');
    }
    return parsed;
  }

  static DateTime? _parseOptionalTimestamp(Object? raw) {
    return parseSupabaseDateTime(raw);
  }
}
