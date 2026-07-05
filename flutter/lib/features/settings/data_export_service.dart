import 'dart:convert';
import 'dart:typed_data';

import 'package:archive/archive.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'file_download.dart';

/// Client-side data export and soft-delete (web `data-export.ts`).
const restoreWindowDays = 60;

class DeletionStatus {
  const DeletionStatus({required this.deletedAt, this.purgeAfter});

  final DateTime deletedAt;
  final DateTime? purgeAfter;
}

String csvEscape(Object? value) {
  if (value == null) return '';
  final s = value is String ? value : jsonEncode(value);
  if (RegExp(r'[",\n]').hasMatch(s)) {
    return '"${s.replaceAll('"', '""')}"';
  }
  return s;
}

String toCsv(List<Map<String, dynamic>> rows) {
  if (rows.isEmpty) return '';
  final cols = <String>{};
  for (final row in rows) {
    cols.addAll(row.keys);
  }
  final ordered = cols.toList();
  final head = ordered.join(',');
  final body = rows
      .map((row) => ordered.map((c) => csvEscape(row[c])).join(','))
      .join('\n');
  return '$head\n$body\n';
}

String safeFile(String s) =>
    s.replaceAll(RegExp(r'[^a-z0-9\-_]', caseSensitive: false), '_');

Future<void> exportAllUserData(SupabaseClient client) async {
  final user = client.auth.currentSession?.user;
  if (user == null) throw StateError('Not signed in');

  final results = await Future.wait([
    client.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    client
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('captured_at'),
    client
        .from('biometrics')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at'),
    client.from('medications').select('*').eq('user_id', user.id),
    client
        .from('medication_doses')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at'),
    client
        .from('seizure_events')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at'),
    client
        .from('risk_forecasts')
        .select('*')
        .eq('user_id', user.id)
        .order('for_date'),
    client
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at'),
  ]);

  final archive = Archive();
  final exportedAt = DateTime.now().toUtc().toIso8601String();
  archive.addFile(
    ArchiveFile(
      'README.md',
      0,
      utf8.encode(
        '# Your Purple export\n\n'
        'Exported $exportedAt for ${user.email ?? user.id}.\n\n'
        'Your data is yours. Take it with you anywhere.\n',
      ),
    ),
  );

  archive.addFile(ArchiveFile(
    'profile.json',
    0,
    utf8.encode(const JsonEncoder.withIndent('  ').convert(results[0])),
  ));

  final biometrics = (results[2] as List?)?.cast<Map<String, dynamic>>() ?? [];
  archive.addFile(ArchiveFile(
    'biometrics.csv',
    0,
    utf8.encode(toCsv(biometrics)),
  ));

  void addJson(String name, Object? data) {
    archive.addFile(ArchiveFile(
      name,
      0,
      utf8.encode(const JsonEncoder.withIndent('  ').convert(data ?? [])),
    ));
  }

  addJson('medications.json', results[3]);
  addJson('medication_doses.json', results[4]);
  addJson('seizures.json', results[5]);
  addJson('risk_forecasts.json', results[6]);
  addJson('alerts.json', results[7]);

  final journal = (results[1] as List?)?.cast<Map<String, dynamic>>() ?? [];
  for (final entry in journal) {
    final captured = DateTime.tryParse('${entry['captured_at']}') ??
        DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
    final slug =
        '${captured.toIso8601String().substring(0, 10)}_${safeFile('${entry['id']}').substring(0, 8)}';
    final lines = <String>[
      '# ${captured.toLocal()}',
      '',
      if (entry['text'] != null) ...['## Text', '${entry['text']}', ''],
    ];
    archive.addFile(ArchiveFile(
      'journal/$slug.md',
      0,
      utf8.encode(lines.join('\n')),
    ));
  }

  final zipBytes = Uint8List.fromList(ZipEncoder().encode(archive));
  final filename =
      'purple-export-${DateTime.now().toIso8601String().substring(0, 10)}.zip';
  await downloadBytes(filename, zipBytes);
}

Future<DeletionStatus?> checkDeletionStatus(
  SupabaseClient client,
  String userId,
) async {
  final row = await client
      .from('profiles')
      .select('deleted_at, purge_after')
      .eq('id', userId)
      .maybeSingle();
  final deletedAtRaw = row?['deleted_at'];
  if (deletedAtRaw == null) return null;
  final deletedAt = DateTime.tryParse('$deletedAtRaw');
  if (deletedAt == null) return null;
  final purgeRaw = row?['purge_after'];
  return DeletionStatus(
    deletedAt: deletedAt,
    purgeAfter: purgeRaw == null ? null : DateTime.tryParse('$purgeRaw'),
  );
}

bool userHasPasswordIdentity(User user) {
  if (user.identities?.any((i) => i.provider == 'email') == true) {
    return true;
  }
  final providers = user.appMetadata['providers'];
  if (providers is List && providers.contains('email')) return true;
  return user.appMetadata['provider'] == 'email';
}

Future<void> softDeleteAuthenticatedUser(SupabaseClient client) async {
  final user = client.auth.currentSession?.user;
  if (user == null) throw StateError('Not signed in');
  final now = DateTime.now().toUtc();
  final purgeAfter = now.add(const Duration(days: restoreWindowDays));
  await client.from('profiles').update({
    'deleted_at': now.toIso8601String(),
    'purge_after': purgeAfter.toIso8601String(),
  }).eq('id', user.id);
}

Future<void> softDeleteUserData(
  SupabaseClient client, {
  required String password,
}) async {
  final user = client.auth.currentSession?.user;
  final email = user?.email;
  if (user == null || email == null) throw StateError('Not signed in');
  await client.auth.signInWithPassword(email: email, password: password);
  await softDeleteAuthenticatedUser(client);
}

Future<void> restoreUserData(SupabaseClient client) async {
  final userId = client.auth.currentSession?.user.id;
  if (userId == null) throw StateError('Not signed in');
  await client.from('profiles').update({
    'deleted_at': null,
    'purge_after': null,
  }).eq('id', userId);
}
