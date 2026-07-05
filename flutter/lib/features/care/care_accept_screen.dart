import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_theme.dart';
import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import 'care_repository.dart';

/// In-app caregiver-invite accept handler.
///
/// Native equivalent of marketing `src/routes/care.accept.tsx`: it takes the
/// `?token=` from the deep link, calls the same `acceptInvite` server contract,
/// and on success lands on the owner's care dashboard. Sign-in is enforced by
/// [authRedirect] (the route is under `/care`, a protected prefix), which
/// preserves the full `/care/accept?token=...` URL through sign-in via `from`.
class CareAcceptScreen extends ConsumerStatefulWidget {
  const CareAcceptScreen({super.key, this.token});

  final String? token;

  @override
  ConsumerState<CareAcceptScreen> createState() => _CareAcceptScreenState();
}

enum _AcceptState { running, error }

class _CareAcceptScreenState extends ConsumerState<CareAcceptScreen> {
  _AcceptState _state = _AcceptState.running;
  String _message = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _run());
  }

  Future<void> _run() async {
    final token = widget.token?.trim();
    if (token == null || token.isEmpty) {
      setState(() {
        _state = _AcceptState.error;
        _message = 'This link is missing its invite token.';
      });
      return;
    }

    try {
      final ownerId =
          await ref.read(careRepositoryProvider).acceptInvite(token);
      if (!mounted) return;
      // Refresh care lists / inbox badge, then land on their dashboard.
      ref.invalidate(careIndexProvider);
      ref.invalidate(carePendingCountProvider);
      context.go(AppRoutes.careDashboard(ownerId));
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _state = _AcceptState.error;
        _message = error.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Center(
        child: ShellContentColumn(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Caregiver invite',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Join their circle',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontFamily: PurpleType.serif,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 16),
              if (_state == _AcceptState.running) ...[
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: PurpleColors.foregroundTertiary,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Accepting your invite…',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.7),
                      ),
                ),
              ] else ...[
                Text(
                  _message,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 12,
                  alignment: WrapAlignment.center,
                  children: [
                    OutlinedButton(
                      onPressed: () => context.go(AppRoutes.careIndex),
                      child: const Text('Go to Care'),
                    ),
                    FilledButton(
                      onPressed: () {
                        setState(() {
                          _state = _AcceptState.running;
                          _message = '';
                        });
                        _run();
                      },
                      child: const Text('Try again'),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
