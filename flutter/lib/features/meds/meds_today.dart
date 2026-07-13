import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import 'models/dose.dart';

bool _tzInitialized = false;

void _ensureTimezones() {
  if (_tzInitialized) return;
  tz_data.initializeTimeZones();
  _tzInitialized = true;
}

const _statusRank = <String, int>{
  'taken': 4,
  'missed': 3,
  'skipped': 2,
  'pending': 1,
};

/// Resolve profile timezone with device fallback, then UTC.
String resolveUserTimezone(String? profileTz) {
  if (profileTz != null && profileTz.trim().isNotEmpty) {
    return profileTz.trim();
  }
  try {
    final name = DateTime.now().timeZoneName;
    if (name.isNotEmpty && name != 'UTC') return name;
  } catch (_) {}
  return 'UTC';
}

tz.Location _locationFor(String tzName) {
  _ensureTimezones();
  try {
    return tz.getLocation(tzName);
  } catch (_) {
    return tz.UTC;
  }
}

String _pad2(int n) => n.toString().padLeft(2, '0');

/// Convert a (date, HH:MM) interpreted in [tzName] into UTC.
DateTime? tzLocalToUtc(String dateStr, String time, String tzName) {
  try {
    final parts = time.split(':');
    if (parts.length < 2) return null;
    final h = int.parse(parts[0]);
    final m = int.parse(parts[1]);
    final loc = _locationFor(tzName);
    final local = tz.TZDateTime(
      loc,
      int.parse(dateStr.substring(0, 4)),
      int.parse(dateStr.substring(5, 7)),
      int.parse(dateStr.substring(8, 10)),
      h,
      m,
    );
    return local.toUtc();
  } catch (_) {
    return null;
  }
}

/// Today's date as YYYY-MM-DD in the given timezone.
String todayStringForTimezone(String tzName) {
  final loc = _locationFor(tzName);
  final now = tz.TZDateTime.now(loc);
  return '${now.year.toString().padLeft(4, '0')}-'
      '${_pad2(now.month)}-'
      '${_pad2(now.day)}';
}

/// Human label for a YYYY-MM-DD date in [tzName].
String dateLabelForTimezone(String dateStr, String tzName) {
  final anchor = DateTime.parse('${dateStr}T12:00:00Z');
  return DateFormat.yMMMMEEEEd().format(
    tz.TZDateTime.from(anchor, _locationFor(tzName)),
  );
}

/// Start/end of a calendar date in the user's timezone, as UTC bounds.
({String startIso, String endIso, String label}) dayWindowForTimezone(
  String tzName,
  String dateStr,
) {
  final start = tzLocalToUtc(dateStr, '00:00', tzName) ?? DateTime.now().toUtc();
  final endBase = tzLocalToUtc(dateStr, '23:59', tzName) ?? DateTime.now().toUtc();
  final end = endBase.add(const Duration(milliseconds: 59999));
  return (
    startIso: start.toIso8601String(),
    endIso: end.toIso8601String(),
    label: dateLabelForTimezone(dateStr, tzName),
  );
}

/// Start/end of today in the user's timezone, as UTC ISO bounds.
({String startIso, String endIso, String todayLabel}) todayWindowForTimezone(
  String tzName,
) {
  final todayStr = todayStringForTimezone(tzName);
  final window = dayWindowForTimezone(tzName, todayStr);
  return (
    startIso: window.startIso,
    endIso: window.endIso,
    todayLabel: window.label,
  );
}

String formatDoseLocalTime(DateTime scheduledAt, String tzName) {
  final loc = _locationFor(tzName);
  final local = tz.TZDateTime.from(scheduledAt.toUtc(), loc);
  return DateFormat.jm().format(local);
}

String _doseSlotKey(MedicationDose dose, String tzName) {
  final name = (dose.medication?.name ?? '').trim().toLowerCase();
  final fallback = dose.medication?.id ?? dose.id;
  final time = formatDoseLocalTime(dose.scheduledAt, tzName);
  return '${name.isEmpty ? fallback : name}|$time';
}

/// Collapse duplicate rows for the same med + local time; prefer taken over pending.
List<MedicationDose> dedupeTodayDoses(
  List<MedicationDose> doses,
  String tzName,
) {
  final map = <String, MedicationDose>{};
  for (final dose in doses) {
    final key = _doseSlotKey(dose, tzName);
    final existing = map[key];
    final rank = _statusRank[dose.status] ?? 0;
    final existingRank =
        existing == null ? -1 : (_statusRank[existing.status] ?? 0);
    if (existing == null || rank > existingRank) {
      map[key] = dose;
    }
  }
  final result = map.values.toList()
    ..sort((a, b) => a.scheduledAt.compareTo(b.scheduledAt));
  return result;
}

Future<String> fetchProfileTimezone(
  String userId,
  SupabaseClient supabase,
) async {
  final data = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', userId)
      .maybeSingle();
  return resolveUserTimezone(data?['timezone'] as String?);
}

bool isScheduledDose(MedicationDose dose) {
  final med = dose.medication;
  if (med == null) return false;
  return med.kind != 'rescue' && !med.isRescue;
}

String shiftDateStr(String dateStr, int deltaDays) {
  final d = DateTime.parse('${dateStr}T12:00:00Z');
  return d.add(Duration(days: deltaDays)).toIso8601String().substring(0, 10);
}

/// Allowed statuses for past-dose create/edit (web `DOSE_STATUSES`).
const kPastDoseStatuses = <String>['taken', 'skipped', 'missed', 'pending'];

String normalizePastDoseStatus(String status) {
  return kPastDoseStatuses.contains(status) ? status : 'taken';
}

/// True only for the user's calendar today. Past days must be fetched as-is
/// (web `getDosesForDate`), never regenerated.
bool shouldRegenerateTodayDoses({
  required String viewDateStr,
  required String todayStr,
}) {
  if (viewDateStr.isEmpty || todayStr.isEmpty) return true;
  return viewDateStr == todayStr;
}

/// Payload for insert/update of a user-logged dose (web med detail `saveDose`).
Map<String, dynamic> buildPastDosePayload({
  required String medicationId,
  required DateTime scheduledAt,
  required String status,
  num? amount,
  String? unit,
  bool includeCreatedByKind = false,
}) {
  final normalized = normalizePastDoseStatus(status);
  final scheduledIso = scheduledAt.toUtc().toIso8601String();
  return <String, dynamic>{
    'medication_id': medicationId,
    'scheduled_at': scheduledIso,
    'status': normalized,
    'amount': amount,
    'unit': unit,
    'taken_at': normalized == 'taken' ? scheduledIso : null,
    if (includeCreatedByKind) 'created_by_kind': 'user',
  };
}

/// One day group for the history screen.
class DoseHistoryDay {
  const DoseHistoryDay({
    required this.date,
    required this.label,
    required this.doses,
    required this.takenCount,
    required this.total,
  });

  final String date;
  final String label;
  final List<MedicationDose> doses;
  final int takenCount;
  final int total;
}
