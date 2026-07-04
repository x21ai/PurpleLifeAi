import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../shared/glass_helpers.dart';
import 'journal_repository.dart';

/// Full-bleed journal capture flow (text entry, offline queue).
class JournalCaptureScreen extends ConsumerStatefulWidget {
  const JournalCaptureScreen({super.key});

  @override
  ConsumerState<JournalCaptureScreen> createState() =>
      _JournalCaptureScreenState();
}

class _JournalCaptureScreenState extends ConsumerState<JournalCaptureScreen> {
  final _controller = TextEditingController();
  DateTime _capturedAt = DateTime.now();
  bool _saving = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final text = _controller.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Write something before saving')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ref.read(journalRepositoryProvider).saveEntry(
            text: text,
            capturedAt: _capturedAt,
          );
      ref.invalidate(journalDataProvider);
      if (mounted) {
        context.go('/journal');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Entry saved')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not save entry')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _capturedAt,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_capturedAt),
    );
    if (time == null || !mounted) return;

    setState(() {
      _capturedAt = DateTime(
        picked.year,
        picked.month,
        picked.day,
        time.hour,
        time.minute,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: _saving ? null : () => context.go('/journal'),
                    icon: Icon(
                      Icons.close,
                      color: Colors.white.withValues(alpha: 0.75),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      'New entry',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.95),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                  FilledButton(
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Theme.of(context).colorScheme.onPrimary,
                            ),
                          )
                        : const Text('Save'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              GlassSurface(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: InkWell(
                  onTap: _pickDate,
                  child: Row(
                    children: [
                      Icon(
                        Icons.schedule,
                        size: 18,
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        DateFormat('EEE, MMM d · h:mm a')
                            .format(_capturedAt.toLocal()),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.75),
                            ),
                      ),
                      const Spacer(),
                      Text(
                        'Change',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.45),
                              decoration: TextDecoration.underline,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: GlassSurface(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    controller: _controller,
                    maxLines: null,
                    expands: true,
                    textAlignVertical: TextAlignVertical.top,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.white.withValues(alpha: 0.92),
                          height: 1.5,
                        ),
                    decoration: InputDecoration(
                      hintText: 'What is happening today?',
                      hintStyle: TextStyle(
                        color: Colors.white.withValues(alpha: 0.35),
                      ),
                      border: InputBorder.none,
                      filled: false,
                    ),
                    autofocus: true,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Saved offline when needed and synced when you reconnect.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.4),
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
