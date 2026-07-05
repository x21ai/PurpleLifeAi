import '../../../core/offline/supabase_row_parse.dart';

/// Medication row parsed from Supabase / Drift cache JSON.
class Medication {
  const Medication({
    required this.id,
    required this.name,
    required this.active,
    required this.kind,
    required this.isRescue,
    this.dosage,
    this.dosageAmount,
    this.dosageUnit,
    this.timesOfDay = const [],
    this.pillsRemaining,
    this.refillThreshold,
    this.startDate,
    this.endDate,
  });

  final String id;
  final String name;
  final bool active;
  final String kind;
  final bool isRescue;
  final String? dosage;
  final num? dosageAmount;
  final String? dosageUnit;
  final List<String> timesOfDay;
  final num? pillsRemaining;
  final num? refillThreshold;
  final String? startDate;
  final String? endDate;

  bool get isRescueMed => isRescue || kind == 'rescue';

  bool get outOfStock => pillsRemaining != null && pillsRemaining! <= 0;

  /// Low stock at or below refill threshold (web defaults threshold to 7).
  bool get lowStock =>
      pillsRemaining != null && pillsRemaining! <= (refillThreshold ?? 7);

  /// True when start_date (YYYY-MM-DD) is after today, local time.
  bool get startsInFuture {
    final start = startDate;
    if (start == null || start.isEmpty) return false;
    final now = DateTime.now();
    final today = '${now.year.toString().padLeft(4, '0')}-'
        '${now.month.toString().padLeft(2, '0')}-'
        '${now.day.toString().padLeft(2, '0')}';
    return start.compareTo(today) > 0;
  }

  String? get strength {
    if (dosage != null && dosage!.trim().isNotEmpty) return dosage;
    if (dosageAmount != null) {
      final unit = dosageUnit == null ? '' : ' $dosageUnit';
      return '$dosageAmount$unit';
    }
    return null;
  }

  factory Medication.fromJson(Map<String, dynamic> json) {
    return Medication(
      id: _requireString(json['id'], field: 'id'),
      name: _readName(json['name']),
      active: _readBool(json['active'] ?? json['is_active'], defaultValue: true),
      kind: _readString(json['kind']) ?? 'medication',
      isRescue: _readBool(json['is_rescue'], defaultValue: false),
      dosage: _readString(json['dosage']),
      dosageAmount: _readNum(json['dosage_amount']),
      dosageUnit: _readString(json['dosage_unit']),
      timesOfDay: _readStringList(json['times_of_day']),
      pillsRemaining: _readNum(json['pills_remaining']),
      refillThreshold: _readNum(json['refill_threshold']),
      startDate: _readDate(json['start_date']),
      endDate: _readDate(json['end_date']),
    );
  }

  static String _readName(Object? raw) {
    if (raw == null) return 'Medication';
    if (raw is String) {
      final trimmed = raw.trim();
      return trimmed.isEmpty ? 'Medication' : trimmed;
    }
    if (raw is List && raw.isNotEmpty) {
      return _readName(raw.first);
    }
    final asString = raw.toString().trim();
    return asString.isEmpty ? 'Medication' : asString;
  }

  static String? _readString(Object? raw) {
    if (raw == null) return null;
    if (raw is String) {
      final trimmed = raw.trim();
      return trimmed.isEmpty ? null : trimmed;
    }
    if (raw is List && raw.isNotEmpty) {
      return _readString(raw.first);
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

  static bool _readBool(Object? raw, {required bool defaultValue}) {
    if (raw is bool) return raw;
    if (raw is num) return raw != 0;
    if (raw is String) {
      final normalized = raw.trim().toLowerCase();
      if (normalized == 'true' || normalized == 't' || normalized == '1') {
        return true;
      }
      if (normalized == 'false' || normalized == 'f' || normalized == '0') {
        return false;
      }
    }
    return defaultValue;
  }

  static num? _readNum(Object? raw) {
    if (raw == null) return null;
    if (raw is num) return raw;
    if (raw is String) return num.tryParse(raw.trim());
    return null;
  }

  static String? _readDate(Object? raw) {
    final parsed = parseSupabaseDateTime(raw);
    if (parsed != null) {
      return parsed.toUtc().toIso8601String().substring(0, 10);
    }
    return _readString(raw);
  }

  /// Parses Postgres `text[]`, JSON arrays, or comma-separated strings.
  static List<String> _readStringList(Object? raw) {
    if (raw == null) return const [];
    if (raw is List) {
      return raw
          .map((value) => _readString(value))
          .whereType<String>()
          .where((value) => value.isNotEmpty)
          .toList();
    }
    if (raw is String) {
      final trimmed = raw.trim();
      if (trimmed.isEmpty) return const [];
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        final inner = trimmed.substring(1, trimmed.length - 1).trim();
        if (inner.isEmpty) return const [];
        return inner
            .split(',')
            .map((part) => part.trim().replaceAll('"', ''))
            .where((part) => part.isNotEmpty)
            .toList();
      }
      if (trimmed.contains(',')) {
        return trimmed
            .split(',')
            .map((part) => part.trim())
            .where((part) => part.isNotEmpty)
            .toList();
      }
      return [trimmed];
    }
    return const [];
  }
}
