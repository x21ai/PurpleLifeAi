import 'medication.dart';

/// Medication dose row with optional joined medication metadata.
class MedicationDose {
  const MedicationDose({
    required this.id,
    required this.medicationId,
    required this.scheduledAt,
    required this.status,
    this.takenAt,
    this.medication,
  });

  final String id;
  final String medicationId;
  final DateTime scheduledAt;
  final String status;
  final DateTime? takenAt;
  final Medication? medication;

  bool get isPending => status == 'pending';

  factory MedicationDose.fromJson(
    Map<String, dynamic> json, {
    Medication? medication,
  }) {
    final medId = json['medication_id'] as String;
    return MedicationDose(
      id: json['id'] as String,
      medicationId: medId,
      scheduledAt: DateTime.parse(json['scheduled_at'] as String),
      status: json['status'] as String? ?? 'pending',
      takenAt: json['taken_at'] == null
          ? null
          : DateTime.tryParse(json['taken_at'] as String),
      medication: medication,
    );
  }
}
