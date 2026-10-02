import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

/// PostgREST-shaped query that talks to Worker `POST /api/data/query`.
///
/// Supabase mode forwards the same chain to the real client. Cloudflare mode
/// sends the Worker JWT from [token] and never calls `auth.purplelife.org`.
class PurpleQuery implements Future<List<Map<String, dynamic>>> {
  PurpleQuery.cloudflare({
    required AppConfig config,
    required http.Client httpClient,
    required Future<String?> Function() token,
    required String table,
  })  : _config = config,
        _http = httpClient,
        _token = token,
        _table = table,
        _supabase = null;

  PurpleQuery.supabase(Object builder)
      : _config = null,
        _http = null,
        _token = null,
        _table = '',
        _supabase = builder;

  final AppConfig? _config;
  final http.Client? _http;
  final Future<String?> Function()? _token;
  final String _table;
  Object? _supabase;

  String _mode = 'select';
  String _select = '*';
  String? _returnSelect;
  final List<Map<String, dynamic>> _filters = [];
  final List<List<Map<String, dynamic>>> _orGroups = [];
  final List<Map<String, dynamic>> _order = [];
  final List<_LocalFilter> _local = [];
  int? _limit;
  Object? _insert;
  Map<String, dynamic>? _update;
  String? _onConflict;
  Future<List<Map<String, dynamic>>>? _pending;

  PurpleQuery select([String columns = '*']) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).select(columns);
      return this;
    }
    if (_mode == 'insert' || _mode == 'update' || _mode == 'upsert') {
      _returnSelect = columns;
      return this;
    }
    _select = columns;
    return this;
  }

  PurpleQuery eq(String column, Object? value) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).eq(column, value);
      return this;
    }
    _filters.add({'op': 'eq', 'col': column, 'val': value});
    return this;
  }

  PurpleQuery neq(String column, Object? value) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).neq(column, value);
      return this;
    }
    _local.add(_LocalFilter.neq(column, value));
    return this;
  }

  PurpleQuery gte(String column, Object? value) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).gte(column, value);
      return this;
    }
    return _cmp('gte', column, value);
  }

  PurpleQuery lte(String column, Object? value) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).lte(column, value);
      return this;
    }
    return _cmp('lte', column, value);
  }

  PurpleQuery gt(String column, Object? value) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).gt(column, value);
      return this;
    }
    return _cmp('gt', column, value);
  }

  PurpleQuery lt(String column, Object? value) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).lt(column, value);
      return this;
    }
    return _cmp('lt', column, value);
  }

  PurpleQuery _cmp(String op, String column, Object? value) {
    _filters.add({'op': op, 'col': column, 'val': value});
    return this;
  }

  PurpleQuery isFilter(String column, Object? value) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).isFilter(column, value);
      return this;
    }
    _filters.add({'op': 'is', 'col': column, 'val': null});
    return this;
  }

  PurpleQuery inFilter(String column, Iterable<Object?> values) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).inFilter(column, values.toList());
      return this;
    }
    _filters.add({'op': 'in', 'col': column, 'val': values.toList()});
    return this;
  }

  PurpleQuery not(String column, String operator, Object? value) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).not(column, operator, value);
      return this;
    }
    if (operator == 'is' && value == null) {
      _local.add(_LocalFilter.notNull(column));
      return this;
    }
    throw PostgrestException(
      message: 'Unsupported filter not($column, $operator)',
    );
  }

  PurpleQuery filter(String column, String operator, Object? value) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).filter(column, operator, value);
      return this;
    }
    if (operator == 'is' && value == null) {
      _filters.add({'op': 'is', 'col': column, 'val': null});
      return this;
    }
    if (operator == 'eq') return eq(column, value);
    throw PostgrestException(
      message: 'Unsupported filter($column, $operator)',
    );
  }

  PurpleQuery or(String filters) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).or(filters);
      return this;
    }
    final group = parseWorkerOrFilter(filters);
    if (group.isNotEmpty) _orGroups.add(group);
    return this;
  }

  PurpleQuery order(String column, {bool ascending = true}) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).order(column, ascending: ascending);
      return this;
    }
    _order.add({'col': column, 'ascending': ascending});
    return this;
  }

  PurpleQuery limit(int count) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).limit(count);
      return this;
    }
    _limit = count;
    return this;
  }

  PurpleQuery insert(Object row) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).insert(row);
      return this;
    }
    _mode = 'insert';
    if (row is Map) {
      _insert = Map<String, dynamic>.from(row);
    } else if (row is List) {
      _insert = [
        for (final item in row) Map<String, dynamic>.from(item as Map),
      ];
    } else {
      throw const PostgrestException(message: 'insert expects a map or list');
    }
    return this;
  }

  PurpleQuery upsert(Map<String, dynamic> row, {String? onConflict}) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).upsert(row, onConflict: onConflict);
      return this;
    }
    _mode = 'upsert';
    _insert = row;
    _onConflict = onConflict;
    return this;
  }

  PurpleQuery update(Map<String, dynamic> row) {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).update(row);
      return this;
    }
    _mode = 'update';
    _update = row;
    return this;
  }

  PurpleQuery delete() {
    if (_supabase != null) {
      _supabase = (_supabase as dynamic).delete();
      return this;
    }
    _mode = 'delete';
    return this;
  }

  Future<Map<String, dynamic>?> maybeSingle() async {
    if (_supabase != null) {
      final row = await (_supabase as dynamic).maybeSingle();
      if (row == null) return null;
      return Map<String, dynamic>.from(row as Map);
    }
    _limit ??= 2;
    final rows = await _go();
    if (rows.length > 1) {
      throw const PostgrestException(
        message: 'JSON object requested, multiple (or no) rows returned',
      );
    }
    return rows.isEmpty ? null : rows.first;
  }

  Future<Map<String, dynamic>> single() async {
    if (_supabase != null) {
      final row = await (_supabase as dynamic).single();
      return Map<String, dynamic>.from(row as Map);
    }
    _limit ??= 2;
    final rows = await _go();
    if (rows.length != 1) {
      throw const PostgrestException(message: 'Row not found');
    }
    return rows.first;
  }

  Future<List<Map<String, dynamic>>> _go() => _pending ??= _execute();

  Future<List<Map<String, dynamic>>> _execute() async {
    if (_supabase != null) {
      final result = await (_supabase as dynamic);
      return _rowsFrom(result);
    }
    final config = _config;
    final httpClient = _http;
    final tokenReader = _token;
    if (config == null || httpClient == null || tokenReader == null) {
      throw const PostgrestException(message: 'Data client is not configured');
    }
    final token = await tokenReader();
    if (token == null || token.isEmpty) {
      throw const PostgrestException(message: 'Not signed in');
    }
    final uri = workerApiUri(config.workerApiBaseUrl, '/data/query');
    final response = await httpClient.post(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'table': _table,
        'mode': _mode,
        'select': _select,
        'returnSelect': _returnSelect,
        'filters': _filters,
        'orGroups': _orGroups,
        'order': _order,
        'limit': _limit,
        'countExact': false,
        'countHead': false,
        'insert': _insert,
        'update': _update,
        'onConflict': _onConflict,
      }),
    );
    Map<String, dynamic> decoded = {};
    if (response.body.isNotEmpty) {
      final raw = jsonDecode(response.body);
      if (raw is Map) decoded = Map<String, dynamic>.from(raw);
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded['error']?.toString() ?? 'Request failed';
      throw PostgrestException(message: message, code: '${response.statusCode}');
    }
    final error = decoded['error'];
    if (error != null) {
      throw PostgrestException(message: error.toString());
    }
    final rows = _rowsFrom(decoded['data']).where(_keepLocal).toList();
    return rows;
  }

  bool _keepLocal(Map<String, dynamic> row) {
    for (final filter in _local) {
      if (!filter.allows(row)) return false;
    }
    return true;
  }

  static List<Map<String, dynamic>> _rowsFrom(Object? data) {
    if (data == null) return const [];
    if (data is List) {
      return data
          .whereType<Map<dynamic, dynamic>>()
          .map((row) => Map<String, dynamic>.from(row))
          .toList();
    }
    if (data is Map) return [Map<String, dynamic>.from(data)];
    return const [];
  }

  @override
  Stream<List<Map<String, dynamic>>> asStream() => _go().asStream();

  @override
  Future<List<Map<String, dynamic>>> catchError(
    Function onError, {
    bool Function(Object error)? test,
  }) {
    return _go().catchError(onError, test: test);
  }

  @override
  Future<R> then<R>(
    FutureOr<R> Function(List<Map<String, dynamic>> value) onValue, {
    Function? onError,
  }) {
    return _go().then(onValue, onError: onError);
  }

  @override
  Future<List<Map<String, dynamic>>> timeout(
    Duration timeLimit, {
    FutureOr<List<Map<String, dynamic>>> Function()? onTimeout,
  }) {
    return _go().timeout(timeLimit, onTimeout: onTimeout);
  }

  @override
  Future<List<Map<String, dynamic>>> whenComplete(
    FutureOr<void> Function() action,
  ) {
    return _go().whenComplete(action);
  }
}

class _LocalFilter {
  const _LocalFilter.neq(this.column, this.value) : notNull = false;
  const _LocalFilter.notNull(this.column)
      : value = null,
        notNull = true;

  final String column;
  final Object? value;
  final bool notNull;

  bool allows(Map<String, dynamic> row) {
    final current = row[column];
    if (notNull) return current != null;
    return current != value;
  }
}

/// `col.op.val,col2.op2.val2` as Worker `orGroups` clauses.
List<Map<String, dynamic>> parseWorkerOrFilter(String filter) {
  final clauses = <Map<String, dynamic>>[];
  for (final part in filter.split(',')) {
    final trimmed = part.trim();
    if (trimmed.isEmpty) continue;
    final dot = trimmed.indexOf('.');
    if (dot < 0) continue;
    final column = trimmed.substring(0, dot);
    final rest = trimmed.substring(dot + 1);
    final opDot = rest.indexOf('.');
    if (opDot < 0) continue;
    final op = rest.substring(0, opDot);
    final raw = rest.substring(opDot + 1);
    if (op == 'is' && raw == 'null') {
      clauses.add({'op': 'is', 'col': column, 'val': null});
      continue;
    }
    const ops = {'eq', 'gte', 'lte', 'gt', 'lt'};
    if (!ops.contains(op)) continue;
    clauses.add({'op': op, 'col': column, 'val': _parseScalar(raw)});
  }
  return clauses;
}

Object? _parseScalar(String raw) {
  if (raw == 'true') return true;
  if (raw == 'false') return false;
  if (raw == 'null') return null;
  final number = num.tryParse(raw);
  if (number != null && number.toString() == raw) return number;
  return raw;
}

Uri workerApiUri(String base, String path) {
  final trimmed = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
  final suffix = path.startsWith('/') ? path : '/$path';
  return Uri.parse('$trimmed$suffix');
}
