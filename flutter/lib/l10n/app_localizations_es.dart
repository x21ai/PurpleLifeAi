// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get medsMarkTaken => 'Tomada';

  @override
  String medsPillsLeft(int count) {
    return '$count pastillas restantes';
  }

  @override
  String medsCurrentlyPillsLeft(int count) {
    return 'Actualmente $count pastillas restantes';
  }

  @override
  String get medsPillsRemaining => 'Pastillas restantes';

  @override
  String get medsPillsRemainingAfterRefill =>
      'Pastillas restantes despues del resurtido';

  @override
  String get medsPills => 'Pastillas';

  @override
  String get medsFormRefill => 'Resurtido';

  @override
  String get medsRefillSoon => 'Reabastecer pronto';

  @override
  String get medsRefillSoonBadge => 'REABASTECER PRONTO';

  @override
  String get medsRefillToUpdate => 'Resurtir para actualizar';

  @override
  String get medsOutOfStock => 'Cantidad en cero, resurtir para actualizar';

  @override
  String get medsOutOfStockBadge => 'SIN EXISTENCIAS';

  @override
  String get medsZeroStock => 'Sin existencias';

  @override
  String get medsDetailRefillTime => 'hora de resurtir';

  @override
  String get medsUpdateStock => 'Actualizar existencia';

  @override
  String get medsIRefilled => 'Ya resurtí';

  @override
  String get medsUpdatePillCountFailed =>
      'No se pudo actualizar la cantidad de pastillas';
}
