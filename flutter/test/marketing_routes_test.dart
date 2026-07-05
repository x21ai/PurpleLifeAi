import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/design/tokens.dart';
import 'package:purple_app/features/marketing/marketing_about_screen.dart';
import 'package:purple_app/features/marketing/marketing_charter_screen.dart';
import 'package:purple_app/features/marketing/marketing_copy.dart';
import 'package:purple_app/features/marketing/marketing_features_screen.dart';
import 'package:purple_app/features/marketing/marketing_home_screen.dart';
import 'package:purple_app/features/marketing/marketing_pricing_screen.dart';
import 'package:purple_app/features/marketing/marketing_privacy_screen.dart';
import 'package:purple_app/features/marketing/marketing_terms_screen.dart';
import 'package:purple_app/features/marketing/marketing_trust_screen.dart';
import 'package:purple_app/shell/routes.dart';

Widget _wrap(Widget child) {
  return ProviderScope(
    child: MaterialApp(home: child),
  );
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await PurpleTokens.load();
  });

  group('Marketing route constants', () {
    test('marketing paths are public, not protected', () {
      for (final path in AppRoutes.marketingPaths) {
        expect(
          AppRoutes.protectedPaths.contains(path),
          isFalse,
          reason: '$path must stay public',
        );
      }
    });

    test('expected TanStack parity paths', () {
      expect(AppRoutes.marketingPaths, [
        '/',
        '/pricing',
        '/privacy',
        '/about',
        '/trust',
        '/features',
        '/charter',
        '/terms',
      ]);
    });
  });

  group('Marketing screens', () {
    setUp(() {
      TestWidgetsFlutterBinding.ensureInitialized();
    });

    Future<void> pumpMarketing(WidgetTester tester, Widget screen) async {
      tester.view.physicalSize = const Size(1200, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
      await tester.pumpWidget(_wrap(screen));
      await tester.pumpAndSettle();
    }

    testWidgets('home renders hero copy', (tester) async {
      await pumpMarketing(tester, const MarketingHomeScreen());

      expect(find.textContaining('Your health'), findsWidgets);
      expect(find.text(MarketingCopy.homeCtaPrimary), findsOneWidget);
    });

    testWidgets('pricing renders plans and FAQ', (tester) async {
      await pumpMarketing(tester, const MarketingPricingScreen());

      expect(find.textContaining('Simple plans'), findsOneWidget);
      expect(find.text(MarketingCopy.pricingFreePrice), findsOneWidget);
      expect(find.text(MarketingCopy.pricingFaqs.first.q), findsOneWidget);
    });

    testWidgets('privacy renders policy sections', (tester) async {
      await pumpMarketing(tester, const MarketingPrivacyScreen());

      expect(find.text(MarketingCopy.privacyTitle), findsOneWidget);
      expect(find.text('What we collect'), findsOneWidget);
    });

    testWidgets('about renders story copy', (tester) async {
      await pumpMarketing(tester, const MarketingAboutScreen());

      expect(find.text(MarketingCopy.aboutWhyTitle), findsOneWidget);
      expect(find.text(MarketingCopy.aboutStat), findsOneWidget);
    });

    testWidgets('trust renders claims', (tester) async {
      await pumpMarketing(tester, const MarketingTrustScreen());

      expect(
        find.text(MarketingCopy.trustClaims.first.title),
        findsOneWidget,
      );
      expect(find.text(MarketingCopy.trustFounderName), findsOneWidget);
    });

    testWidgets('features renders hero and feature list', (tester) async {
      await pumpMarketing(tester, const MarketingFeaturesScreen());

      expect(find.textContaining('quiet tool'), findsOneWidget);
      expect(
        find.text(MarketingCopy.featuresRestItems.first.title),
        findsOneWidget,
      );
    });

    testWidgets('charter renders founding copy', (tester) async {
      await pumpMarketing(tester, const MarketingCharterScreen());

      expect(find.text(MarketingCopy.charterHeadline), findsOneWidget);
      expect(find.text(MarketingCopy.charterWhoTitle), findsOneWidget);
    });

    testWidgets('terms renders plain-language copy', (tester) async {
      await pumpMarketing(tester, const MarketingTermsScreen());

      expect(find.text(MarketingCopy.termsHeadline), findsOneWidget);
      expect(find.textContaining('personal health journal'), findsOneWidget);
    });
  });
}
