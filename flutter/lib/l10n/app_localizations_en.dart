// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get medsMarkTaken => 'Taken';

  @override
  String medsPillsLeft(int count) {
    return '$count pills left';
  }

  @override
  String medsCurrentlyPillsLeft(int count) {
    return 'Currently $count pills left';
  }

  @override
  String get medsPillsRemaining => 'Pills remaining';

  @override
  String get medsPillsRemainingAfterRefill => 'Pills remaining after refill';

  @override
  String get medsPills => 'Pills';

  @override
  String get medsFormRefill => 'Refill';

  @override
  String get medsRefillSoon => 'Refill soon';

  @override
  String get medsRefillSoonBadge => 'REFILL SOON';

  @override
  String get medsRefillToUpdate => 'Refill to update';

  @override
  String get medsOutOfStock => 'Count zero, refill to update';

  @override
  String get medsOutOfStockBadge => 'OUT OF STOCK';

  @override
  String get medsZeroStock => 'Out of stock';

  @override
  String get medsDetailRefillTime => 'time to refill';

  @override
  String get medsUpdateStock => 'Update stock';

  @override
  String get medsIRefilled => 'I refilled';

  @override
  String get medsUpdatePillCountFailed => 'Could not update pill count';
}
