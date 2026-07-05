import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/config/app_config.dart';
import 'package:purple_app/core/providers/core_providers.dart';
import 'package:purple_app/design/purple_theme.dart';
import 'package:purple_app/design/tokens.dart';
import 'package:purple_app/features/chat/ask_purple_screen.dart';
import 'package:purple_app/features/chat/care_chat_repository.dart';
import 'package:purple_app/features/chat/care_chat_screen.dart';
import 'package:purple_app/features/chat/chat_copy.dart';
import 'package:purple_app/features/chat/chat_repository.dart';
import 'package:purple_app/features/shared/condition_prompts.dart';
import 'package:purple_app/shell/routes.dart';

const _testConfig = AppConfig(
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJpYXQiOjE2NDExMDg5NjAsImV4cCI6MTk1NjY4NDk2MH0.test',
  siteUrl: AppConfig.defaultSiteUrl,
  workerApiBaseUrl: AppConfig.defaultWorkerApiBaseUrl,
);

Widget _wrap(Widget child) {
  return ProviderScope(
    overrides: [
      appConfigProvider.overrideWithValue(_testConfig),
      authSessionProvider.overrideWith((ref) => Stream.value(null)),
      chatConditionsProvider.overrideWith((ref) async => const []),
      careThreadsProvider.overrideWith((ref) async => const []),
      isOnlineProvider.overrideWith((ref) => Stream.value(true)),
    ],
    child: MaterialApp(
      theme: PurpleTheme.dark(),
      home: child,
    ),
  );
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await PurpleTokens.load();
  });

  group('Chat route constants', () {
    test('chat paths are protected', () {
      expect(AppRoutes.protectedPaths.contains(AppRoutes.chat), isTrue);
      expect(AppRoutes.protectedPaths.contains(AppRoutes.chatCare), isTrue);
    });
  });

  group('Ask Purple suggestions', () {
    test('returns general questions when no conditions', () {
      final suggestions = getSuggestedQuestions(const []);
      expect(suggestions, isNotEmpty);
      expect(suggestions.first, contains('sleep'));
    });

    test('returns seizure questions for epilepsy', () {
      final suggestions = getSuggestedQuestions(const ['epilepsy']);
      expect(
        suggestions.any((s) => s.toLowerCase().contains('seizure')),
        isTrue,
      );
    });
  });

  group('Chat screens', () {
    Future<void> pumpChat(WidgetTester tester, Widget screen) async {
      tester.view.physicalSize = const Size(900, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
      await tester.pumpWidget(_wrap(screen));
      await tester.pumpAndSettle();
    }

    testWidgets('ask purple renders header and empty state', (tester) async {
      await pumpChat(tester, const ChatScreen());

      expect(find.textContaining('Your patterns'), findsOneWidget);
      expect(find.text(ChatCopy.askEmptyBody), findsOneWidget);
      expect(find.text(ChatCopy.askComposerHint), findsOneWidget);
    });

    testWidgets('ask purple prefills initial query', (tester) async {
      await pumpChat(
        tester,
        const ChatScreen(initialQuery: 'How did I sleep?'),
      );

      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.controller?.text, 'How did I sleep?');
    });

    testWidgets('care chat renders list shell', (tester) async {
      await pumpChat(tester, const ChatCareScreen());

      expect(find.text(ChatCopy.careTitle), findsOneWidget);
      expect(find.text(ChatCopy.careEmptyTitle), findsOneWidget);
    });
  });

  group('Ask Purple follow-ups', () {
    test('surfaces topical hint keyed on last user message', () {
      final chips = getFollowUps(const [], 'How did I sleep last night?');
      expect(chips, contains('How is sleep trending this month?'));
      expect(chips.length, lessThanOrEqualTo(3));
    });

    test('falls back to condition starters when no topic matches', () {
      final chips = getFollowUps(const ['epilepsy'], 'thanks');
      expect(chips, isNotEmpty);
      expect(chips.length, lessThanOrEqualTo(3));
    });

    test('deduplicates and caps at three', () {
      final chips = getFollowUps(const [], 'med dose pill sleep pain');
      expect(chips.length, lessThanOrEqualTo(3));
      expect(chips.toSet().length, chips.length);
    });
  });

  group('Ask Purple proposal parsing', () {
    test('maps every wire kind to its label', () {
      expect(ProposalKind.fromWire('add_medication'), ProposalKind.addMedication);
      expect(ProposalKind.fromWire('log_seizure'), ProposalKind.logSeizure);
      expect(
        ProposalKind.fromWire('create_journal_entry'),
        ProposalKind.createJournalEntry,
      );
      expect(ProposalKind.fromWire('mark_dose_taken'), ProposalKind.markDoseTaken);
      expect(
        ProposalKind.fromWire('archive_medication'),
        ProposalKind.archiveMedication,
      );
      expect(ProposalKind.fromWire('bogus'), isNull);
    });

    test('displayParams drops null, empty string, and empty array', () {
      const proposal = Proposal(
        kind: ProposalKind.addMedication,
        summary: 'Add Keppra',
        params: {
          'name': 'Keppra',
          'dosage': null,
          'notes': '',
          'times_of_day': <String>[],
          'tags': ['am', 'pm'],
        },
      );
      final map = {for (final e in proposal.displayParams) e.key: e.value};
      expect(map.containsKey('name'), isTrue);
      expect(map.containsKey('dosage'), isFalse);
      expect(map.containsKey('notes'), isFalse);
      expect(map.containsKey('times_of_day'), isFalse);
      expect(map['tags'], 'am, pm');
    });
  });
}
