// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database.dart';

// ignore_for_file: type=lint
class $CachedBiometricsTable extends CachedBiometrics
    with TableInfo<$CachedBiometricsTable, CachedBiometric> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedBiometricsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
      'user_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _recordedAtMeta =
      const VerificationMeta('recordedAt');
  @override
  late final GeneratedColumn<DateTime> recordedAt = GeneratedColumn<DateTime>(
      'recorded_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _cachedAtMeta =
      const VerificationMeta('cachedAt');
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
      'cached_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns =>
      [id, userId, payloadJson, recordedAt, cachedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_biometrics';
  @override
  VerificationContext validateIntegrity(Insertable<CachedBiometric> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(_userIdMeta,
          userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta));
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('recorded_at')) {
      context.handle(
          _recordedAtMeta,
          recordedAt.isAcceptableOrUnknown(
              data['recorded_at']!, _recordedAtMeta));
    } else if (isInserting) {
      context.missing(_recordedAtMeta);
    }
    if (data.containsKey('cached_at')) {
      context.handle(_cachedAtMeta,
          cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedBiometric map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedBiometric(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      userId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}user_id'])!,
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json'])!,
      recordedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}recorded_at'])!,
      cachedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}cached_at'])!,
    );
  }

  @override
  $CachedBiometricsTable createAlias(String alias) {
    return $CachedBiometricsTable(attachedDatabase, alias);
  }
}

class CachedBiometric extends DataClass implements Insertable<CachedBiometric> {
  final String id;
  final String userId;
  final String payloadJson;
  final DateTime recordedAt;
  final DateTime cachedAt;
  const CachedBiometric(
      {required this.id,
      required this.userId,
      required this.payloadJson,
      required this.recordedAt,
      required this.cachedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['user_id'] = Variable<String>(userId);
    map['payload_json'] = Variable<String>(payloadJson);
    map['recorded_at'] = Variable<DateTime>(recordedAt);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedBiometricsCompanion toCompanion(bool nullToAbsent) {
    return CachedBiometricsCompanion(
      id: Value(id),
      userId: Value(userId),
      payloadJson: Value(payloadJson),
      recordedAt: Value(recordedAt),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedBiometric.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedBiometric(
      id: serializer.fromJson<String>(json['id']),
      userId: serializer.fromJson<String>(json['userId']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      recordedAt: serializer.fromJson<DateTime>(json['recordedAt']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'userId': serializer.toJson<String>(userId),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'recordedAt': serializer.toJson<DateTime>(recordedAt),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedBiometric copyWith(
          {String? id,
          String? userId,
          String? payloadJson,
          DateTime? recordedAt,
          DateTime? cachedAt}) =>
      CachedBiometric(
        id: id ?? this.id,
        userId: userId ?? this.userId,
        payloadJson: payloadJson ?? this.payloadJson,
        recordedAt: recordedAt ?? this.recordedAt,
        cachedAt: cachedAt ?? this.cachedAt,
      );
  CachedBiometric copyWithCompanion(CachedBiometricsCompanion data) {
    return CachedBiometric(
      id: data.id.present ? data.id.value : this.id,
      userId: data.userId.present ? data.userId.value : this.userId,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      recordedAt:
          data.recordedAt.present ? data.recordedAt.value : this.recordedAt,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedBiometric(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('recordedAt: $recordedAt, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, userId, payloadJson, recordedAt, cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedBiometric &&
          other.id == this.id &&
          other.userId == this.userId &&
          other.payloadJson == this.payloadJson &&
          other.recordedAt == this.recordedAt &&
          other.cachedAt == this.cachedAt);
}

class CachedBiometricsCompanion extends UpdateCompanion<CachedBiometric> {
  final Value<String> id;
  final Value<String> userId;
  final Value<String> payloadJson;
  final Value<DateTime> recordedAt;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedBiometricsCompanion({
    this.id = const Value.absent(),
    this.userId = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.recordedAt = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedBiometricsCompanion.insert({
    required String id,
    required String userId,
    required String payloadJson,
    required DateTime recordedAt,
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        userId = Value(userId),
        payloadJson = Value(payloadJson),
        recordedAt = Value(recordedAt);
  static Insertable<CachedBiometric> custom({
    Expression<String>? id,
    Expression<String>? userId,
    Expression<String>? payloadJson,
    Expression<DateTime>? recordedAt,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (userId != null) 'user_id': userId,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (recordedAt != null) 'recorded_at': recordedAt,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedBiometricsCompanion copyWith(
      {Value<String>? id,
      Value<String>? userId,
      Value<String>? payloadJson,
      Value<DateTime>? recordedAt,
      Value<DateTime>? cachedAt,
      Value<int>? rowid}) {
    return CachedBiometricsCompanion(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      payloadJson: payloadJson ?? this.payloadJson,
      recordedAt: recordedAt ?? this.recordedAt,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (recordedAt.present) {
      map['recorded_at'] = Variable<DateTime>(recordedAt.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedBiometricsCompanion(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('recordedAt: $recordedAt, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedMedicationsTable extends CachedMedications
    with TableInfo<$CachedMedicationsTable, CachedMedication> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedMedicationsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
      'user_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _cachedAtMeta =
      const VerificationMeta('cachedAt');
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
      'cached_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns =>
      [id, userId, payloadJson, updatedAt, cachedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_medications';
  @override
  VerificationContext validateIntegrity(Insertable<CachedMedication> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(_userIdMeta,
          userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta));
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    if (data.containsKey('cached_at')) {
      context.handle(_cachedAtMeta,
          cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedMedication map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedMedication(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      userId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}user_id'])!,
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      cachedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}cached_at'])!,
    );
  }

  @override
  $CachedMedicationsTable createAlias(String alias) {
    return $CachedMedicationsTable(attachedDatabase, alias);
  }
}

class CachedMedication extends DataClass
    implements Insertable<CachedMedication> {
  final String id;
  final String userId;
  final String payloadJson;
  final DateTime updatedAt;
  final DateTime cachedAt;
  const CachedMedication(
      {required this.id,
      required this.userId,
      required this.payloadJson,
      required this.updatedAt,
      required this.cachedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['user_id'] = Variable<String>(userId);
    map['payload_json'] = Variable<String>(payloadJson);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedMedicationsCompanion toCompanion(bool nullToAbsent) {
    return CachedMedicationsCompanion(
      id: Value(id),
      userId: Value(userId),
      payloadJson: Value(payloadJson),
      updatedAt: Value(updatedAt),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedMedication.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedMedication(
      id: serializer.fromJson<String>(json['id']),
      userId: serializer.fromJson<String>(json['userId']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'userId': serializer.toJson<String>(userId),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedMedication copyWith(
          {String? id,
          String? userId,
          String? payloadJson,
          DateTime? updatedAt,
          DateTime? cachedAt}) =>
      CachedMedication(
        id: id ?? this.id,
        userId: userId ?? this.userId,
        payloadJson: payloadJson ?? this.payloadJson,
        updatedAt: updatedAt ?? this.updatedAt,
        cachedAt: cachedAt ?? this.cachedAt,
      );
  CachedMedication copyWithCompanion(CachedMedicationsCompanion data) {
    return CachedMedication(
      id: data.id.present ? data.id.value : this.id,
      userId: data.userId.present ? data.userId.value : this.userId,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedMedication(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, userId, payloadJson, updatedAt, cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedMedication &&
          other.id == this.id &&
          other.userId == this.userId &&
          other.payloadJson == this.payloadJson &&
          other.updatedAt == this.updatedAt &&
          other.cachedAt == this.cachedAt);
}

class CachedMedicationsCompanion extends UpdateCompanion<CachedMedication> {
  final Value<String> id;
  final Value<String> userId;
  final Value<String> payloadJson;
  final Value<DateTime> updatedAt;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedMedicationsCompanion({
    this.id = const Value.absent(),
    this.userId = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedMedicationsCompanion.insert({
    required String id,
    required String userId,
    required String payloadJson,
    required DateTime updatedAt,
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        userId = Value(userId),
        payloadJson = Value(payloadJson),
        updatedAt = Value(updatedAt);
  static Insertable<CachedMedication> custom({
    Expression<String>? id,
    Expression<String>? userId,
    Expression<String>? payloadJson,
    Expression<DateTime>? updatedAt,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (userId != null) 'user_id': userId,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedMedicationsCompanion copyWith(
      {Value<String>? id,
      Value<String>? userId,
      Value<String>? payloadJson,
      Value<DateTime>? updatedAt,
      Value<DateTime>? cachedAt,
      Value<int>? rowid}) {
    return CachedMedicationsCompanion(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      payloadJson: payloadJson ?? this.payloadJson,
      updatedAt: updatedAt ?? this.updatedAt,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedMedicationsCompanion(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedDosesTable extends CachedDoses
    with TableInfo<$CachedDosesTable, CachedDose> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedDosesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
      'user_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _medicationIdMeta =
      const VerificationMeta('medicationId');
  @override
  late final GeneratedColumn<String> medicationId = GeneratedColumn<String>(
      'medication_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _scheduledAtMeta =
      const VerificationMeta('scheduledAt');
  @override
  late final GeneratedColumn<DateTime> scheduledAt = GeneratedColumn<DateTime>(
      'scheduled_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _cachedAtMeta =
      const VerificationMeta('cachedAt');
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
      'cached_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns =>
      [id, userId, medicationId, payloadJson, scheduledAt, cachedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_doses';
  @override
  VerificationContext validateIntegrity(Insertable<CachedDose> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(_userIdMeta,
          userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta));
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('medication_id')) {
      context.handle(
          _medicationIdMeta,
          medicationId.isAcceptableOrUnknown(
              data['medication_id']!, _medicationIdMeta));
    } else if (isInserting) {
      context.missing(_medicationIdMeta);
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('scheduled_at')) {
      context.handle(
          _scheduledAtMeta,
          scheduledAt.isAcceptableOrUnknown(
              data['scheduled_at']!, _scheduledAtMeta));
    } else if (isInserting) {
      context.missing(_scheduledAtMeta);
    }
    if (data.containsKey('cached_at')) {
      context.handle(_cachedAtMeta,
          cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedDose map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedDose(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      userId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}user_id'])!,
      medicationId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}medication_id'])!,
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json'])!,
      scheduledAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}scheduled_at'])!,
      cachedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}cached_at'])!,
    );
  }

  @override
  $CachedDosesTable createAlias(String alias) {
    return $CachedDosesTable(attachedDatabase, alias);
  }
}

class CachedDose extends DataClass implements Insertable<CachedDose> {
  final String id;
  final String userId;
  final String medicationId;
  final String payloadJson;
  final DateTime scheduledAt;
  final DateTime cachedAt;
  const CachedDose(
      {required this.id,
      required this.userId,
      required this.medicationId,
      required this.payloadJson,
      required this.scheduledAt,
      required this.cachedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['user_id'] = Variable<String>(userId);
    map['medication_id'] = Variable<String>(medicationId);
    map['payload_json'] = Variable<String>(payloadJson);
    map['scheduled_at'] = Variable<DateTime>(scheduledAt);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedDosesCompanion toCompanion(bool nullToAbsent) {
    return CachedDosesCompanion(
      id: Value(id),
      userId: Value(userId),
      medicationId: Value(medicationId),
      payloadJson: Value(payloadJson),
      scheduledAt: Value(scheduledAt),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedDose.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedDose(
      id: serializer.fromJson<String>(json['id']),
      userId: serializer.fromJson<String>(json['userId']),
      medicationId: serializer.fromJson<String>(json['medicationId']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      scheduledAt: serializer.fromJson<DateTime>(json['scheduledAt']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'userId': serializer.toJson<String>(userId),
      'medicationId': serializer.toJson<String>(medicationId),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'scheduledAt': serializer.toJson<DateTime>(scheduledAt),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedDose copyWith(
          {String? id,
          String? userId,
          String? medicationId,
          String? payloadJson,
          DateTime? scheduledAt,
          DateTime? cachedAt}) =>
      CachedDose(
        id: id ?? this.id,
        userId: userId ?? this.userId,
        medicationId: medicationId ?? this.medicationId,
        payloadJson: payloadJson ?? this.payloadJson,
        scheduledAt: scheduledAt ?? this.scheduledAt,
        cachedAt: cachedAt ?? this.cachedAt,
      );
  CachedDose copyWithCompanion(CachedDosesCompanion data) {
    return CachedDose(
      id: data.id.present ? data.id.value : this.id,
      userId: data.userId.present ? data.userId.value : this.userId,
      medicationId: data.medicationId.present
          ? data.medicationId.value
          : this.medicationId,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      scheduledAt:
          data.scheduledAt.present ? data.scheduledAt.value : this.scheduledAt,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedDose(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('medicationId: $medicationId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('scheduledAt: $scheduledAt, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, userId, medicationId, payloadJson, scheduledAt, cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedDose &&
          other.id == this.id &&
          other.userId == this.userId &&
          other.medicationId == this.medicationId &&
          other.payloadJson == this.payloadJson &&
          other.scheduledAt == this.scheduledAt &&
          other.cachedAt == this.cachedAt);
}

class CachedDosesCompanion extends UpdateCompanion<CachedDose> {
  final Value<String> id;
  final Value<String> userId;
  final Value<String> medicationId;
  final Value<String> payloadJson;
  final Value<DateTime> scheduledAt;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedDosesCompanion({
    this.id = const Value.absent(),
    this.userId = const Value.absent(),
    this.medicationId = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.scheduledAt = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedDosesCompanion.insert({
    required String id,
    required String userId,
    required String medicationId,
    required String payloadJson,
    required DateTime scheduledAt,
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        userId = Value(userId),
        medicationId = Value(medicationId),
        payloadJson = Value(payloadJson),
        scheduledAt = Value(scheduledAt);
  static Insertable<CachedDose> custom({
    Expression<String>? id,
    Expression<String>? userId,
    Expression<String>? medicationId,
    Expression<String>? payloadJson,
    Expression<DateTime>? scheduledAt,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (userId != null) 'user_id': userId,
      if (medicationId != null) 'medication_id': medicationId,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (scheduledAt != null) 'scheduled_at': scheduledAt,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedDosesCompanion copyWith(
      {Value<String>? id,
      Value<String>? userId,
      Value<String>? medicationId,
      Value<String>? payloadJson,
      Value<DateTime>? scheduledAt,
      Value<DateTime>? cachedAt,
      Value<int>? rowid}) {
    return CachedDosesCompanion(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      medicationId: medicationId ?? this.medicationId,
      payloadJson: payloadJson ?? this.payloadJson,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (medicationId.present) {
      map['medication_id'] = Variable<String>(medicationId.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (scheduledAt.present) {
      map['scheduled_at'] = Variable<DateTime>(scheduledAt.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedDosesCompanion(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('medicationId: $medicationId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('scheduledAt: $scheduledAt, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedJournalEntriesTable extends CachedJournalEntries
    with TableInfo<$CachedJournalEntriesTable, CachedJournalEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedJournalEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
      'user_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _capturedAtMeta =
      const VerificationMeta('capturedAt');
  @override
  late final GeneratedColumn<DateTime> capturedAt = GeneratedColumn<DateTime>(
      'captured_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _pendingUploadMeta =
      const VerificationMeta('pendingUpload');
  @override
  late final GeneratedColumn<bool> pendingUpload = GeneratedColumn<bool>(
      'pending_upload', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("pending_upload" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _cachedAtMeta =
      const VerificationMeta('cachedAt');
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
      'cached_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns =>
      [id, userId, payloadJson, capturedAt, pendingUpload, cachedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_journal_entries';
  @override
  VerificationContext validateIntegrity(Insertable<CachedJournalEntry> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(_userIdMeta,
          userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta));
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('captured_at')) {
      context.handle(
          _capturedAtMeta,
          capturedAt.isAcceptableOrUnknown(
              data['captured_at']!, _capturedAtMeta));
    } else if (isInserting) {
      context.missing(_capturedAtMeta);
    }
    if (data.containsKey('pending_upload')) {
      context.handle(
          _pendingUploadMeta,
          pendingUpload.isAcceptableOrUnknown(
              data['pending_upload']!, _pendingUploadMeta));
    }
    if (data.containsKey('cached_at')) {
      context.handle(_cachedAtMeta,
          cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedJournalEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedJournalEntry(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      userId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}user_id'])!,
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json'])!,
      capturedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}captured_at'])!,
      pendingUpload: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}pending_upload'])!,
      cachedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}cached_at'])!,
    );
  }

  @override
  $CachedJournalEntriesTable createAlias(String alias) {
    return $CachedJournalEntriesTable(attachedDatabase, alias);
  }
}

class CachedJournalEntry extends DataClass
    implements Insertable<CachedJournalEntry> {
  final String id;
  final String userId;
  final String payloadJson;
  final DateTime capturedAt;
  final bool pendingUpload;
  final DateTime cachedAt;
  const CachedJournalEntry(
      {required this.id,
      required this.userId,
      required this.payloadJson,
      required this.capturedAt,
      required this.pendingUpload,
      required this.cachedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['user_id'] = Variable<String>(userId);
    map['payload_json'] = Variable<String>(payloadJson);
    map['captured_at'] = Variable<DateTime>(capturedAt);
    map['pending_upload'] = Variable<bool>(pendingUpload);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedJournalEntriesCompanion toCompanion(bool nullToAbsent) {
    return CachedJournalEntriesCompanion(
      id: Value(id),
      userId: Value(userId),
      payloadJson: Value(payloadJson),
      capturedAt: Value(capturedAt),
      pendingUpload: Value(pendingUpload),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedJournalEntry.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedJournalEntry(
      id: serializer.fromJson<String>(json['id']),
      userId: serializer.fromJson<String>(json['userId']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      capturedAt: serializer.fromJson<DateTime>(json['capturedAt']),
      pendingUpload: serializer.fromJson<bool>(json['pendingUpload']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'userId': serializer.toJson<String>(userId),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'capturedAt': serializer.toJson<DateTime>(capturedAt),
      'pendingUpload': serializer.toJson<bool>(pendingUpload),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedJournalEntry copyWith(
          {String? id,
          String? userId,
          String? payloadJson,
          DateTime? capturedAt,
          bool? pendingUpload,
          DateTime? cachedAt}) =>
      CachedJournalEntry(
        id: id ?? this.id,
        userId: userId ?? this.userId,
        payloadJson: payloadJson ?? this.payloadJson,
        capturedAt: capturedAt ?? this.capturedAt,
        pendingUpload: pendingUpload ?? this.pendingUpload,
        cachedAt: cachedAt ?? this.cachedAt,
      );
  CachedJournalEntry copyWithCompanion(CachedJournalEntriesCompanion data) {
    return CachedJournalEntry(
      id: data.id.present ? data.id.value : this.id,
      userId: data.userId.present ? data.userId.value : this.userId,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      capturedAt:
          data.capturedAt.present ? data.capturedAt.value : this.capturedAt,
      pendingUpload: data.pendingUpload.present
          ? data.pendingUpload.value
          : this.pendingUpload,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedJournalEntry(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('capturedAt: $capturedAt, ')
          ..write('pendingUpload: $pendingUpload, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, userId, payloadJson, capturedAt, pendingUpload, cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedJournalEntry &&
          other.id == this.id &&
          other.userId == this.userId &&
          other.payloadJson == this.payloadJson &&
          other.capturedAt == this.capturedAt &&
          other.pendingUpload == this.pendingUpload &&
          other.cachedAt == this.cachedAt);
}

class CachedJournalEntriesCompanion
    extends UpdateCompanion<CachedJournalEntry> {
  final Value<String> id;
  final Value<String> userId;
  final Value<String> payloadJson;
  final Value<DateTime> capturedAt;
  final Value<bool> pendingUpload;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedJournalEntriesCompanion({
    this.id = const Value.absent(),
    this.userId = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.capturedAt = const Value.absent(),
    this.pendingUpload = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedJournalEntriesCompanion.insert({
    required String id,
    required String userId,
    required String payloadJson,
    required DateTime capturedAt,
    this.pendingUpload = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        userId = Value(userId),
        payloadJson = Value(payloadJson),
        capturedAt = Value(capturedAt);
  static Insertable<CachedJournalEntry> custom({
    Expression<String>? id,
    Expression<String>? userId,
    Expression<String>? payloadJson,
    Expression<DateTime>? capturedAt,
    Expression<bool>? pendingUpload,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (userId != null) 'user_id': userId,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (capturedAt != null) 'captured_at': capturedAt,
      if (pendingUpload != null) 'pending_upload': pendingUpload,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedJournalEntriesCompanion copyWith(
      {Value<String>? id,
      Value<String>? userId,
      Value<String>? payloadJson,
      Value<DateTime>? capturedAt,
      Value<bool>? pendingUpload,
      Value<DateTime>? cachedAt,
      Value<int>? rowid}) {
    return CachedJournalEntriesCompanion(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      payloadJson: payloadJson ?? this.payloadJson,
      capturedAt: capturedAt ?? this.capturedAt,
      pendingUpload: pendingUpload ?? this.pendingUpload,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (capturedAt.present) {
      map['captured_at'] = Variable<DateTime>(capturedAt.value);
    }
    if (pendingUpload.present) {
      map['pending_upload'] = Variable<bool>(pendingUpload.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedJournalEntriesCompanion(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('capturedAt: $capturedAt, ')
          ..write('pendingUpload: $pendingUpload, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncQueueTable extends SyncQueue
    with TableInfo<$SyncQueueTable, SyncQueueData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncQueueTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _targetTableMeta =
      const VerificationMeta('targetTable');
  @override
  late final GeneratedColumn<String> targetTable = GeneratedColumn<String>(
      'target_table', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _operationMeta =
      const VerificationMeta('operation');
  @override
  late final GeneratedColumn<String> operation = GeneratedColumn<String>(
      'operation', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _recordIdMeta =
      const VerificationMeta('recordId');
  @override
  late final GeneratedColumn<String> recordId = GeneratedColumn<String>(
      'record_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _retryCountMeta =
      const VerificationMeta('retryCount');
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
      'retry_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _lastErrorMeta =
      const VerificationMeta('lastError');
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
      'last_error', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        targetTable,
        operation,
        recordId,
        payloadJson,
        createdAt,
        retryCount,
        lastError
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_queue';
  @override
  VerificationContext validateIntegrity(Insertable<SyncQueueData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('target_table')) {
      context.handle(
          _targetTableMeta,
          targetTable.isAcceptableOrUnknown(
              data['target_table']!, _targetTableMeta));
    } else if (isInserting) {
      context.missing(_targetTableMeta);
    }
    if (data.containsKey('operation')) {
      context.handle(_operationMeta,
          operation.isAcceptableOrUnknown(data['operation']!, _operationMeta));
    } else if (isInserting) {
      context.missing(_operationMeta);
    }
    if (data.containsKey('record_id')) {
      context.handle(_recordIdMeta,
          recordId.isAcceptableOrUnknown(data['record_id']!, _recordIdMeta));
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('retry_count')) {
      context.handle(
          _retryCountMeta,
          retryCount.isAcceptableOrUnknown(
              data['retry_count']!, _retryCountMeta));
    }
    if (data.containsKey('last_error')) {
      context.handle(_lastErrorMeta,
          lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncQueueData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncQueueData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      targetTable: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}target_table'])!,
      operation: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}operation'])!,
      recordId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}record_id']),
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      retryCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}retry_count'])!,
      lastError: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}last_error']),
    );
  }

  @override
  $SyncQueueTable createAlias(String alias) {
    return $SyncQueueTable(attachedDatabase, alias);
  }
}

class SyncQueueData extends DataClass implements Insertable<SyncQueueData> {
  final int id;
  final String targetTable;
  final String operation;
  final String? recordId;
  final String payloadJson;
  final DateTime createdAt;
  final int retryCount;
  final String? lastError;
  const SyncQueueData(
      {required this.id,
      required this.targetTable,
      required this.operation,
      this.recordId,
      required this.payloadJson,
      required this.createdAt,
      required this.retryCount,
      this.lastError});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['target_table'] = Variable<String>(targetTable);
    map['operation'] = Variable<String>(operation);
    if (!nullToAbsent || recordId != null) {
      map['record_id'] = Variable<String>(recordId);
    }
    map['payload_json'] = Variable<String>(payloadJson);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['retry_count'] = Variable<int>(retryCount);
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    return map;
  }

  SyncQueueCompanion toCompanion(bool nullToAbsent) {
    return SyncQueueCompanion(
      id: Value(id),
      targetTable: Value(targetTable),
      operation: Value(operation),
      recordId: recordId == null && nullToAbsent
          ? const Value.absent()
          : Value(recordId),
      payloadJson: Value(payloadJson),
      createdAt: Value(createdAt),
      retryCount: Value(retryCount),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
    );
  }

  factory SyncQueueData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncQueueData(
      id: serializer.fromJson<int>(json['id']),
      targetTable: serializer.fromJson<String>(json['targetTable']),
      operation: serializer.fromJson<String>(json['operation']),
      recordId: serializer.fromJson<String?>(json['recordId']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
      lastError: serializer.fromJson<String?>(json['lastError']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'targetTable': serializer.toJson<String>(targetTable),
      'operation': serializer.toJson<String>(operation),
      'recordId': serializer.toJson<String?>(recordId),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'retryCount': serializer.toJson<int>(retryCount),
      'lastError': serializer.toJson<String?>(lastError),
    };
  }

  SyncQueueData copyWith(
          {int? id,
          String? targetTable,
          String? operation,
          Value<String?> recordId = const Value.absent(),
          String? payloadJson,
          DateTime? createdAt,
          int? retryCount,
          Value<String?> lastError = const Value.absent()}) =>
      SyncQueueData(
        id: id ?? this.id,
        targetTable: targetTable ?? this.targetTable,
        operation: operation ?? this.operation,
        recordId: recordId.present ? recordId.value : this.recordId,
        payloadJson: payloadJson ?? this.payloadJson,
        createdAt: createdAt ?? this.createdAt,
        retryCount: retryCount ?? this.retryCount,
        lastError: lastError.present ? lastError.value : this.lastError,
      );
  SyncQueueData copyWithCompanion(SyncQueueCompanion data) {
    return SyncQueueData(
      id: data.id.present ? data.id.value : this.id,
      targetTable:
          data.targetTable.present ? data.targetTable.value : this.targetTable,
      operation: data.operation.present ? data.operation.value : this.operation,
      recordId: data.recordId.present ? data.recordId.value : this.recordId,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      retryCount:
          data.retryCount.present ? data.retryCount.value : this.retryCount,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueData(')
          ..write('id: $id, ')
          ..write('targetTable: $targetTable, ')
          ..write('operation: $operation, ')
          ..write('recordId: $recordId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('createdAt: $createdAt, ')
          ..write('retryCount: $retryCount, ')
          ..write('lastError: $lastError')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, targetTable, operation, recordId,
      payloadJson, createdAt, retryCount, lastError);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncQueueData &&
          other.id == this.id &&
          other.targetTable == this.targetTable &&
          other.operation == this.operation &&
          other.recordId == this.recordId &&
          other.payloadJson == this.payloadJson &&
          other.createdAt == this.createdAt &&
          other.retryCount == this.retryCount &&
          other.lastError == this.lastError);
}

class SyncQueueCompanion extends UpdateCompanion<SyncQueueData> {
  final Value<int> id;
  final Value<String> targetTable;
  final Value<String> operation;
  final Value<String?> recordId;
  final Value<String> payloadJson;
  final Value<DateTime> createdAt;
  final Value<int> retryCount;
  final Value<String?> lastError;
  const SyncQueueCompanion({
    this.id = const Value.absent(),
    this.targetTable = const Value.absent(),
    this.operation = const Value.absent(),
    this.recordId = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.lastError = const Value.absent(),
  });
  SyncQueueCompanion.insert({
    this.id = const Value.absent(),
    required String targetTable,
    required String operation,
    this.recordId = const Value.absent(),
    required String payloadJson,
    this.createdAt = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.lastError = const Value.absent(),
  })  : targetTable = Value(targetTable),
        operation = Value(operation),
        payloadJson = Value(payloadJson);
  static Insertable<SyncQueueData> custom({
    Expression<int>? id,
    Expression<String>? targetTable,
    Expression<String>? operation,
    Expression<String>? recordId,
    Expression<String>? payloadJson,
    Expression<DateTime>? createdAt,
    Expression<int>? retryCount,
    Expression<String>? lastError,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (targetTable != null) 'target_table': targetTable,
      if (operation != null) 'operation': operation,
      if (recordId != null) 'record_id': recordId,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (createdAt != null) 'created_at': createdAt,
      if (retryCount != null) 'retry_count': retryCount,
      if (lastError != null) 'last_error': lastError,
    });
  }

  SyncQueueCompanion copyWith(
      {Value<int>? id,
      Value<String>? targetTable,
      Value<String>? operation,
      Value<String?>? recordId,
      Value<String>? payloadJson,
      Value<DateTime>? createdAt,
      Value<int>? retryCount,
      Value<String?>? lastError}) {
    return SyncQueueCompanion(
      id: id ?? this.id,
      targetTable: targetTable ?? this.targetTable,
      operation: operation ?? this.operation,
      recordId: recordId ?? this.recordId,
      payloadJson: payloadJson ?? this.payloadJson,
      createdAt: createdAt ?? this.createdAt,
      retryCount: retryCount ?? this.retryCount,
      lastError: lastError ?? this.lastError,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (targetTable.present) {
      map['target_table'] = Variable<String>(targetTable.value);
    }
    if (operation.present) {
      map['operation'] = Variable<String>(operation.value);
    }
    if (recordId.present) {
      map['record_id'] = Variable<String>(recordId.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueCompanion(')
          ..write('id: $id, ')
          ..write('targetTable: $targetTable, ')
          ..write('operation: $operation, ')
          ..write('recordId: $recordId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('createdAt: $createdAt, ')
          ..write('retryCount: $retryCount, ')
          ..write('lastError: $lastError')
          ..write(')'))
        .toString();
  }
}

class $TableSyncStateTable extends TableSyncState
    with TableInfo<$TableSyncStateTable, TableSyncStateData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TableSyncStateTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _targetTableMeta =
      const VerificationMeta('targetTable');
  @override
  late final GeneratedColumn<String> targetTable = GeneratedColumn<String>(
      'target_table', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _lastSyncedAtMeta =
      const VerificationMeta('lastSyncedAt');
  @override
  late final GeneratedColumn<DateTime> lastSyncedAt = GeneratedColumn<DateTime>(
      'last_synced_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [targetTable, lastSyncedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'table_sync_state';
  @override
  VerificationContext validateIntegrity(Insertable<TableSyncStateData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('target_table')) {
      context.handle(
          _targetTableMeta,
          targetTable.isAcceptableOrUnknown(
              data['target_table']!, _targetTableMeta));
    } else if (isInserting) {
      context.missing(_targetTableMeta);
    }
    if (data.containsKey('last_synced_at')) {
      context.handle(
          _lastSyncedAtMeta,
          lastSyncedAt.isAcceptableOrUnknown(
              data['last_synced_at']!, _lastSyncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {targetTable};
  @override
  TableSyncStateData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return TableSyncStateData(
      targetTable: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}target_table'])!,
      lastSyncedAt: attachedDatabase.typeMapping.read(
          DriftSqlType.dateTime, data['${effectivePrefix}last_synced_at']),
    );
  }

  @override
  $TableSyncStateTable createAlias(String alias) {
    return $TableSyncStateTable(attachedDatabase, alias);
  }
}

class TableSyncStateData extends DataClass
    implements Insertable<TableSyncStateData> {
  final String targetTable;
  final DateTime? lastSyncedAt;
  const TableSyncStateData({required this.targetTable, this.lastSyncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['target_table'] = Variable<String>(targetTable);
    if (!nullToAbsent || lastSyncedAt != null) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt);
    }
    return map;
  }

  TableSyncStateCompanion toCompanion(bool nullToAbsent) {
    return TableSyncStateCompanion(
      targetTable: Value(targetTable),
      lastSyncedAt: lastSyncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncedAt),
    );
  }

  factory TableSyncStateData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return TableSyncStateData(
      targetTable: serializer.fromJson<String>(json['targetTable']),
      lastSyncedAt: serializer.fromJson<DateTime?>(json['lastSyncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'targetTable': serializer.toJson<String>(targetTable),
      'lastSyncedAt': serializer.toJson<DateTime?>(lastSyncedAt),
    };
  }

  TableSyncStateData copyWith(
          {String? targetTable,
          Value<DateTime?> lastSyncedAt = const Value.absent()}) =>
      TableSyncStateData(
        targetTable: targetTable ?? this.targetTable,
        lastSyncedAt:
            lastSyncedAt.present ? lastSyncedAt.value : this.lastSyncedAt,
      );
  TableSyncStateData copyWithCompanion(TableSyncStateCompanion data) {
    return TableSyncStateData(
      targetTable:
          data.targetTable.present ? data.targetTable.value : this.targetTable,
      lastSyncedAt: data.lastSyncedAt.present
          ? data.lastSyncedAt.value
          : this.lastSyncedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TableSyncStateData(')
          ..write('targetTable: $targetTable, ')
          ..write('lastSyncedAt: $lastSyncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(targetTable, lastSyncedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TableSyncStateData &&
          other.targetTable == this.targetTable &&
          other.lastSyncedAt == this.lastSyncedAt);
}

class TableSyncStateCompanion extends UpdateCompanion<TableSyncStateData> {
  final Value<String> targetTable;
  final Value<DateTime?> lastSyncedAt;
  final Value<int> rowid;
  const TableSyncStateCompanion({
    this.targetTable = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  TableSyncStateCompanion.insert({
    required String targetTable,
    this.lastSyncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : targetTable = Value(targetTable);
  static Insertable<TableSyncStateData> custom({
    Expression<String>? targetTable,
    Expression<DateTime>? lastSyncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (targetTable != null) 'target_table': targetTable,
      if (lastSyncedAt != null) 'last_synced_at': lastSyncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  TableSyncStateCompanion copyWith(
      {Value<String>? targetTable,
      Value<DateTime?>? lastSyncedAt,
      Value<int>? rowid}) {
    return TableSyncStateCompanion(
      targetTable: targetTable ?? this.targetTable,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (targetTable.present) {
      map['target_table'] = Variable<String>(targetTable.value);
    }
    if (lastSyncedAt.present) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TableSyncStateCompanion(')
          ..write('targetTable: $targetTable, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $CachedBiometricsTable cachedBiometrics =
      $CachedBiometricsTable(this);
  late final $CachedMedicationsTable cachedMedications =
      $CachedMedicationsTable(this);
  late final $CachedDosesTable cachedDoses = $CachedDosesTable(this);
  late final $CachedJournalEntriesTable cachedJournalEntries =
      $CachedJournalEntriesTable(this);
  late final $SyncQueueTable syncQueue = $SyncQueueTable(this);
  late final $TableSyncStateTable tableSyncState = $TableSyncStateTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
        cachedBiometrics,
        cachedMedications,
        cachedDoses,
        cachedJournalEntries,
        syncQueue,
        tableSyncState
      ];
}

typedef $$CachedBiometricsTableCreateCompanionBuilder
    = CachedBiometricsCompanion Function({
  required String id,
  required String userId,
  required String payloadJson,
  required DateTime recordedAt,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});
typedef $$CachedBiometricsTableUpdateCompanionBuilder
    = CachedBiometricsCompanion Function({
  Value<String> id,
  Value<String> userId,
  Value<String> payloadJson,
  Value<DateTime> recordedAt,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});

class $$CachedBiometricsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedBiometricsTable> {
  $$CachedBiometricsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get recordedAt => $composableBuilder(
      column: $table.recordedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnFilters(column));
}

class $$CachedBiometricsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedBiometricsTable> {
  $$CachedBiometricsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get recordedAt => $composableBuilder(
      column: $table.recordedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedBiometricsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedBiometricsTable> {
  $$CachedBiometricsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<DateTime> get recordedAt => $composableBuilder(
      column: $table.recordedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedBiometricsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedBiometricsTable,
    CachedBiometric,
    $$CachedBiometricsTableFilterComposer,
    $$CachedBiometricsTableOrderingComposer,
    $$CachedBiometricsTableAnnotationComposer,
    $$CachedBiometricsTableCreateCompanionBuilder,
    $$CachedBiometricsTableUpdateCompanionBuilder,
    (
      CachedBiometric,
      BaseReferences<_$AppDatabase, $CachedBiometricsTable, CachedBiometric>
    ),
    CachedBiometric,
    PrefetchHooks Function()> {
  $$CachedBiometricsTableTableManager(
      _$AppDatabase db, $CachedBiometricsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedBiometricsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedBiometricsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedBiometricsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> userId = const Value.absent(),
            Value<String> payloadJson = const Value.absent(),
            Value<DateTime> recordedAt = const Value.absent(),
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedBiometricsCompanion(
            id: id,
            userId: userId,
            payloadJson: payloadJson,
            recordedAt: recordedAt,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String userId,
            required String payloadJson,
            required DateTime recordedAt,
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedBiometricsCompanion.insert(
            id: id,
            userId: userId,
            payloadJson: payloadJson,
            recordedAt: recordedAt,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedBiometricsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CachedBiometricsTable,
    CachedBiometric,
    $$CachedBiometricsTableFilterComposer,
    $$CachedBiometricsTableOrderingComposer,
    $$CachedBiometricsTableAnnotationComposer,
    $$CachedBiometricsTableCreateCompanionBuilder,
    $$CachedBiometricsTableUpdateCompanionBuilder,
    (
      CachedBiometric,
      BaseReferences<_$AppDatabase, $CachedBiometricsTable, CachedBiometric>
    ),
    CachedBiometric,
    PrefetchHooks Function()>;
typedef $$CachedMedicationsTableCreateCompanionBuilder
    = CachedMedicationsCompanion Function({
  required String id,
  required String userId,
  required String payloadJson,
  required DateTime updatedAt,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});
typedef $$CachedMedicationsTableUpdateCompanionBuilder
    = CachedMedicationsCompanion Function({
  Value<String> id,
  Value<String> userId,
  Value<String> payloadJson,
  Value<DateTime> updatedAt,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});

class $$CachedMedicationsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedMedicationsTable> {
  $$CachedMedicationsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnFilters(column));
}

class $$CachedMedicationsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedMedicationsTable> {
  $$CachedMedicationsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedMedicationsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedMedicationsTable> {
  $$CachedMedicationsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedMedicationsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedMedicationsTable,
    CachedMedication,
    $$CachedMedicationsTableFilterComposer,
    $$CachedMedicationsTableOrderingComposer,
    $$CachedMedicationsTableAnnotationComposer,
    $$CachedMedicationsTableCreateCompanionBuilder,
    $$CachedMedicationsTableUpdateCompanionBuilder,
    (
      CachedMedication,
      BaseReferences<_$AppDatabase, $CachedMedicationsTable, CachedMedication>
    ),
    CachedMedication,
    PrefetchHooks Function()> {
  $$CachedMedicationsTableTableManager(
      _$AppDatabase db, $CachedMedicationsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedMedicationsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedMedicationsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedMedicationsTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> userId = const Value.absent(),
            Value<String> payloadJson = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedMedicationsCompanion(
            id: id,
            userId: userId,
            payloadJson: payloadJson,
            updatedAt: updatedAt,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String userId,
            required String payloadJson,
            required DateTime updatedAt,
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedMedicationsCompanion.insert(
            id: id,
            userId: userId,
            payloadJson: payloadJson,
            updatedAt: updatedAt,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedMedicationsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CachedMedicationsTable,
    CachedMedication,
    $$CachedMedicationsTableFilterComposer,
    $$CachedMedicationsTableOrderingComposer,
    $$CachedMedicationsTableAnnotationComposer,
    $$CachedMedicationsTableCreateCompanionBuilder,
    $$CachedMedicationsTableUpdateCompanionBuilder,
    (
      CachedMedication,
      BaseReferences<_$AppDatabase, $CachedMedicationsTable, CachedMedication>
    ),
    CachedMedication,
    PrefetchHooks Function()>;
typedef $$CachedDosesTableCreateCompanionBuilder = CachedDosesCompanion
    Function({
  required String id,
  required String userId,
  required String medicationId,
  required String payloadJson,
  required DateTime scheduledAt,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});
typedef $$CachedDosesTableUpdateCompanionBuilder = CachedDosesCompanion
    Function({
  Value<String> id,
  Value<String> userId,
  Value<String> medicationId,
  Value<String> payloadJson,
  Value<DateTime> scheduledAt,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});

class $$CachedDosesTableFilterComposer
    extends Composer<_$AppDatabase, $CachedDosesTable> {
  $$CachedDosesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get medicationId => $composableBuilder(
      column: $table.medicationId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get scheduledAt => $composableBuilder(
      column: $table.scheduledAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnFilters(column));
}

class $$CachedDosesTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedDosesTable> {
  $$CachedDosesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get medicationId => $composableBuilder(
      column: $table.medicationId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get scheduledAt => $composableBuilder(
      column: $table.scheduledAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedDosesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedDosesTable> {
  $$CachedDosesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get medicationId => $composableBuilder(
      column: $table.medicationId, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<DateTime> get scheduledAt => $composableBuilder(
      column: $table.scheduledAt, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedDosesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedDosesTable,
    CachedDose,
    $$CachedDosesTableFilterComposer,
    $$CachedDosesTableOrderingComposer,
    $$CachedDosesTableAnnotationComposer,
    $$CachedDosesTableCreateCompanionBuilder,
    $$CachedDosesTableUpdateCompanionBuilder,
    (CachedDose, BaseReferences<_$AppDatabase, $CachedDosesTable, CachedDose>),
    CachedDose,
    PrefetchHooks Function()> {
  $$CachedDosesTableTableManager(_$AppDatabase db, $CachedDosesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedDosesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedDosesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedDosesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> userId = const Value.absent(),
            Value<String> medicationId = const Value.absent(),
            Value<String> payloadJson = const Value.absent(),
            Value<DateTime> scheduledAt = const Value.absent(),
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedDosesCompanion(
            id: id,
            userId: userId,
            medicationId: medicationId,
            payloadJson: payloadJson,
            scheduledAt: scheduledAt,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String userId,
            required String medicationId,
            required String payloadJson,
            required DateTime scheduledAt,
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedDosesCompanion.insert(
            id: id,
            userId: userId,
            medicationId: medicationId,
            payloadJson: payloadJson,
            scheduledAt: scheduledAt,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedDosesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CachedDosesTable,
    CachedDose,
    $$CachedDosesTableFilterComposer,
    $$CachedDosesTableOrderingComposer,
    $$CachedDosesTableAnnotationComposer,
    $$CachedDosesTableCreateCompanionBuilder,
    $$CachedDosesTableUpdateCompanionBuilder,
    (CachedDose, BaseReferences<_$AppDatabase, $CachedDosesTable, CachedDose>),
    CachedDose,
    PrefetchHooks Function()>;
typedef $$CachedJournalEntriesTableCreateCompanionBuilder
    = CachedJournalEntriesCompanion Function({
  required String id,
  required String userId,
  required String payloadJson,
  required DateTime capturedAt,
  Value<bool> pendingUpload,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});
typedef $$CachedJournalEntriesTableUpdateCompanionBuilder
    = CachedJournalEntriesCompanion Function({
  Value<String> id,
  Value<String> userId,
  Value<String> payloadJson,
  Value<DateTime> capturedAt,
  Value<bool> pendingUpload,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});

class $$CachedJournalEntriesTableFilterComposer
    extends Composer<_$AppDatabase, $CachedJournalEntriesTable> {
  $$CachedJournalEntriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get capturedAt => $composableBuilder(
      column: $table.capturedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get pendingUpload => $composableBuilder(
      column: $table.pendingUpload, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnFilters(column));
}

class $$CachedJournalEntriesTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedJournalEntriesTable> {
  $$CachedJournalEntriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get capturedAt => $composableBuilder(
      column: $table.capturedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get pendingUpload => $composableBuilder(
      column: $table.pendingUpload,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedJournalEntriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedJournalEntriesTable> {
  $$CachedJournalEntriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<DateTime> get capturedAt => $composableBuilder(
      column: $table.capturedAt, builder: (column) => column);

  GeneratedColumn<bool> get pendingUpload => $composableBuilder(
      column: $table.pendingUpload, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedJournalEntriesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedJournalEntriesTable,
    CachedJournalEntry,
    $$CachedJournalEntriesTableFilterComposer,
    $$CachedJournalEntriesTableOrderingComposer,
    $$CachedJournalEntriesTableAnnotationComposer,
    $$CachedJournalEntriesTableCreateCompanionBuilder,
    $$CachedJournalEntriesTableUpdateCompanionBuilder,
    (
      CachedJournalEntry,
      BaseReferences<_$AppDatabase, $CachedJournalEntriesTable,
          CachedJournalEntry>
    ),
    CachedJournalEntry,
    PrefetchHooks Function()> {
  $$CachedJournalEntriesTableTableManager(
      _$AppDatabase db, $CachedJournalEntriesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedJournalEntriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedJournalEntriesTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedJournalEntriesTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> userId = const Value.absent(),
            Value<String> payloadJson = const Value.absent(),
            Value<DateTime> capturedAt = const Value.absent(),
            Value<bool> pendingUpload = const Value.absent(),
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedJournalEntriesCompanion(
            id: id,
            userId: userId,
            payloadJson: payloadJson,
            capturedAt: capturedAt,
            pendingUpload: pendingUpload,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String userId,
            required String payloadJson,
            required DateTime capturedAt,
            Value<bool> pendingUpload = const Value.absent(),
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedJournalEntriesCompanion.insert(
            id: id,
            userId: userId,
            payloadJson: payloadJson,
            capturedAt: capturedAt,
            pendingUpload: pendingUpload,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedJournalEntriesTableProcessedTableManager
    = ProcessedTableManager<
        _$AppDatabase,
        $CachedJournalEntriesTable,
        CachedJournalEntry,
        $$CachedJournalEntriesTableFilterComposer,
        $$CachedJournalEntriesTableOrderingComposer,
        $$CachedJournalEntriesTableAnnotationComposer,
        $$CachedJournalEntriesTableCreateCompanionBuilder,
        $$CachedJournalEntriesTableUpdateCompanionBuilder,
        (
          CachedJournalEntry,
          BaseReferences<_$AppDatabase, $CachedJournalEntriesTable,
              CachedJournalEntry>
        ),
        CachedJournalEntry,
        PrefetchHooks Function()>;
typedef $$SyncQueueTableCreateCompanionBuilder = SyncQueueCompanion Function({
  Value<int> id,
  required String targetTable,
  required String operation,
  Value<String?> recordId,
  required String payloadJson,
  Value<DateTime> createdAt,
  Value<int> retryCount,
  Value<String?> lastError,
});
typedef $$SyncQueueTableUpdateCompanionBuilder = SyncQueueCompanion Function({
  Value<int> id,
  Value<String> targetTable,
  Value<String> operation,
  Value<String?> recordId,
  Value<String> payloadJson,
  Value<DateTime> createdAt,
  Value<int> retryCount,
  Value<String?> lastError,
});

class $$SyncQueueTableFilterComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get targetTable => $composableBuilder(
      column: $table.targetTable, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get operation => $composableBuilder(
      column: $table.operation, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get recordId => $composableBuilder(
      column: $table.recordId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnFilters(column));
}

class $$SyncQueueTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get targetTable => $composableBuilder(
      column: $table.targetTable, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get operation => $composableBuilder(
      column: $table.operation, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get recordId => $composableBuilder(
      column: $table.recordId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnOrderings(column));
}

class $$SyncQueueTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get targetTable => $composableBuilder(
      column: $table.targetTable, builder: (column) => column);

  GeneratedColumn<String> get operation =>
      $composableBuilder(column: $table.operation, builder: (column) => column);

  GeneratedColumn<String> get recordId =>
      $composableBuilder(column: $table.recordId, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => column);

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);
}

class $$SyncQueueTableTableManager extends RootTableManager<
    _$AppDatabase,
    $SyncQueueTable,
    SyncQueueData,
    $$SyncQueueTableFilterComposer,
    $$SyncQueueTableOrderingComposer,
    $$SyncQueueTableAnnotationComposer,
    $$SyncQueueTableCreateCompanionBuilder,
    $$SyncQueueTableUpdateCompanionBuilder,
    (
      SyncQueueData,
      BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>
    ),
    SyncQueueData,
    PrefetchHooks Function()> {
  $$SyncQueueTableTableManager(_$AppDatabase db, $SyncQueueTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncQueueTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncQueueTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncQueueTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> targetTable = const Value.absent(),
            Value<String> operation = const Value.absent(),
            Value<String?> recordId = const Value.absent(),
            Value<String> payloadJson = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
          }) =>
              SyncQueueCompanion(
            id: id,
            targetTable: targetTable,
            operation: operation,
            recordId: recordId,
            payloadJson: payloadJson,
            createdAt: createdAt,
            retryCount: retryCount,
            lastError: lastError,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String targetTable,
            required String operation,
            Value<String?> recordId = const Value.absent(),
            required String payloadJson,
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
          }) =>
              SyncQueueCompanion.insert(
            id: id,
            targetTable: targetTable,
            operation: operation,
            recordId: recordId,
            payloadJson: payloadJson,
            createdAt: createdAt,
            retryCount: retryCount,
            lastError: lastError,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SyncQueueTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $SyncQueueTable,
    SyncQueueData,
    $$SyncQueueTableFilterComposer,
    $$SyncQueueTableOrderingComposer,
    $$SyncQueueTableAnnotationComposer,
    $$SyncQueueTableCreateCompanionBuilder,
    $$SyncQueueTableUpdateCompanionBuilder,
    (
      SyncQueueData,
      BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>
    ),
    SyncQueueData,
    PrefetchHooks Function()>;
typedef $$TableSyncStateTableCreateCompanionBuilder = TableSyncStateCompanion
    Function({
  required String targetTable,
  Value<DateTime?> lastSyncedAt,
  Value<int> rowid,
});
typedef $$TableSyncStateTableUpdateCompanionBuilder = TableSyncStateCompanion
    Function({
  Value<String> targetTable,
  Value<DateTime?> lastSyncedAt,
  Value<int> rowid,
});

class $$TableSyncStateTableFilterComposer
    extends Composer<_$AppDatabase, $TableSyncStateTable> {
  $$TableSyncStateTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get targetTable => $composableBuilder(
      column: $table.targetTable, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get lastSyncedAt => $composableBuilder(
      column: $table.lastSyncedAt, builder: (column) => ColumnFilters(column));
}

class $$TableSyncStateTableOrderingComposer
    extends Composer<_$AppDatabase, $TableSyncStateTable> {
  $$TableSyncStateTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get targetTable => $composableBuilder(
      column: $table.targetTable, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get lastSyncedAt => $composableBuilder(
      column: $table.lastSyncedAt,
      builder: (column) => ColumnOrderings(column));
}

class $$TableSyncStateTableAnnotationComposer
    extends Composer<_$AppDatabase, $TableSyncStateTable> {
  $$TableSyncStateTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get targetTable => $composableBuilder(
      column: $table.targetTable, builder: (column) => column);

  GeneratedColumn<DateTime> get lastSyncedAt => $composableBuilder(
      column: $table.lastSyncedAt, builder: (column) => column);
}

class $$TableSyncStateTableTableManager extends RootTableManager<
    _$AppDatabase,
    $TableSyncStateTable,
    TableSyncStateData,
    $$TableSyncStateTableFilterComposer,
    $$TableSyncStateTableOrderingComposer,
    $$TableSyncStateTableAnnotationComposer,
    $$TableSyncStateTableCreateCompanionBuilder,
    $$TableSyncStateTableUpdateCompanionBuilder,
    (
      TableSyncStateData,
      BaseReferences<_$AppDatabase, $TableSyncStateTable, TableSyncStateData>
    ),
    TableSyncStateData,
    PrefetchHooks Function()> {
  $$TableSyncStateTableTableManager(
      _$AppDatabase db, $TableSyncStateTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TableSyncStateTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TableSyncStateTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TableSyncStateTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> targetTable = const Value.absent(),
            Value<DateTime?> lastSyncedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              TableSyncStateCompanion(
            targetTable: targetTable,
            lastSyncedAt: lastSyncedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String targetTable,
            Value<DateTime?> lastSyncedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              TableSyncStateCompanion.insert(
            targetTable: targetTable,
            lastSyncedAt: lastSyncedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$TableSyncStateTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $TableSyncStateTable,
    TableSyncStateData,
    $$TableSyncStateTableFilterComposer,
    $$TableSyncStateTableOrderingComposer,
    $$TableSyncStateTableAnnotationComposer,
    $$TableSyncStateTableCreateCompanionBuilder,
    $$TableSyncStateTableUpdateCompanionBuilder,
    (
      TableSyncStateData,
      BaseReferences<_$AppDatabase, $TableSyncStateTable, TableSyncStateData>
    ),
    TableSyncStateData,
    PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$CachedBiometricsTableTableManager get cachedBiometrics =>
      $$CachedBiometricsTableTableManager(_db, _db.cachedBiometrics);
  $$CachedMedicationsTableTableManager get cachedMedications =>
      $$CachedMedicationsTableTableManager(_db, _db.cachedMedications);
  $$CachedDosesTableTableManager get cachedDoses =>
      $$CachedDosesTableTableManager(_db, _db.cachedDoses);
  $$CachedJournalEntriesTableTableManager get cachedJournalEntries =>
      $$CachedJournalEntriesTableTableManager(_db, _db.cachedJournalEntries);
  $$SyncQueueTableTableManager get syncQueue =>
      $$SyncQueueTableTableManager(_db, _db.syncQueue);
  $$TableSyncStateTableTableManager get tableSyncState =>
      $$TableSyncStateTableTableManager(_db, _db.tableSyncState);
}
