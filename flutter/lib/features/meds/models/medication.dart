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
  final String? startDate;
  final String? endDate;

  bool get isRescueMed => isRescue || kind == 'rescue';

  String? get strength {
    if (dosage != null && dosage!.trim().isNotEmpty) return dosage;
    if (dosageAmount != null) {
      final unit = dosageUnit == null ? '' : ' $dosageUnit';
      return '$dosageAmount$unit';
    }
    return null;
  }

  factory Medication.fromJson(Map<String, dynamic> json) {
    final timesRaw = json['times_of_day'];
    return Medication(
      id: json['id'] as String,
      name: json['name'] as String,
      active: json['active'] as bool? ?? true,
      kind: json['kind'] as String? ?? 'medication',
      isRescue: json['is_rescue'] as bool? ?? false,
      dosage: json['dosage'] as String?,
      dosageAmount: json['dosage_amount'] as num?,
      dosageUnit: json['dosage_unit'] as String?,
      timesOfDay: timesRaw is List
          ? timesRaw.map((e) => e.toString()).toList()
          : const [],
      pillsRemaining: json['pills_remaining'] as num?,
      startDate: json['start_date'] as String?,
      endDate: json['end_date'] as String?,
    );
  }
}
