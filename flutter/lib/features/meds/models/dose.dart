import '../../../core/offline/supabase_row_parse.dart';
import 'medication.dart';

/// Medication dose row with optional joined medication metadata.
class MedicationDose {
  const MedicationDose({
    required this.id,
    required this.medicationId,
    required this.scheduledAt,
    required this.status,
    this.takenAt,
    this.amount,
    this.unit,
    this.medication,
  });

  final String id;
  final String medicationId;
  final DateTime scheduledAt;
  final String status;
  final DateTime? takenAt;
  final num? amount;
  final String? unit;
  final Medication? medication;

  bool get isPending => status == 'pending';

  String? get amountLabel {
    if (amount == null) return null;
    final unitSuffix = unit == null || unit!.trim().isEmpty ? '' : ' $unit';
    return '$amount$unitSuffix';
  }

  factory MedicationDose.fromJson(
    Map<String, dynamic> json, {
    Medication? medication,
  }) {
    final nested = json['medication'];
    final resolvedMedication = medication ??
        (nested is Map<String, dynamic> ? Medication.fromJson(nested) : null);

    return MedicationDose(
      id: _requireString(json['id'], field: 'id'),
      medicationId: _requireString(json['medication_id'], field: 'medication_id'),
      scheduledAt: _parseTimestamp(json['scheduled_at'], field: 'scheduled_at'),
      status: _readString(json['status']) ?? 'pending',
      takenAt: _parseOptionalTimestamp(json['taken_at']),
      amount: _readNum(json['amount']),
      unit: _readString(json['unit']),
      medication: resolvedMedication,
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

  static num? _readNum(Object? raw) {
    if (raw == null) return null;
    if (raw is num) return raw;
    if (raw is String) return num.tryParse(raw.trim());
    return null;
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
