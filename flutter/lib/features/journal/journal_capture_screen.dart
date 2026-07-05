import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../shared/glass_helpers.dart';
import 'journal_repository.dart';
import 'journal_style.dart';

/// Journal capture flow mirroring web `journal.new.tsx` (standard dark theme
/// canvas): sticky bar (close, title, Save pill), "when" picker, serif text
/// card, offline queue note. Text-first; media capture stays web/native-only.
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
  void initState() {
    super.initState();
    _controller.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool get _hasContent => _controller.text.trim().isNotEmpty;

  Future<void> _save() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _saving) return;

    setState(() => _saving = true);
    try {
      final repository = ref.read(journalRepositoryProvider);
      await repository.saveEntry(
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
          const SnackBar(
            content: Text(
              "Your entry didn't save. It's still here on this screen, try again in a moment.",
            ),
          ),
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
    final palette = JournalPalette.dark();
    return CanvasBackground(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _TopBar(
              palette: palette,
              saving: _saving,
              canSave: _hasContent && !_saving,
              onClose: _saving ? null : () => context.go('/journal'),
              onSave: _save,
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
                child: ContentColumn(
                  padding: EdgeInsets.zero,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionEyebrow(
                        'When did this happen?',
                        palette: palette,
                      ),
                      const SizedBox(height: 8),
                      _WhenPicker(
                        palette: palette,
                        capturedAt: _capturedAt,
                        onTap: _pickDate,
                      ),
                      const SizedBox(height: 20),
                      GlassSurface(
                        padding: const EdgeInsets.all(20),
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(minHeight: 220),
                          child: TextField(
                            controller: _controller,
                            maxLines: null,
                            minLines: 8,
                            textAlignVertical: TextAlignVertical.top,
                            style: journalSerif(
                              fontSize: 18,
                              height: 1.5,
                              color:
                                  palette.textPrimary.withValues(alpha: 0.92),
                            ),
                            decoration: InputDecoration(
                              hintText:
                                  'What is happening, or what just happened?',
                              hintStyle: journalSans(
                                fontSize: 16,
                                color:
                                    palette.textPrimary.withValues(alpha: 0.4),
                              ),
                              border: InputBorder.none,
                              filled: false,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                            autofocus: true,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _CaptureDock(
                        palette: palette,
                        onNativeOnly: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Voice, photo, and video capture ship on iOS and Android. Text entries work here now.',
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                      Text(
                        "If Purple can't reach the server, your entry is saved on this device and will sync when you're back online.",
                        textAlign: TextAlign.center,
                        style: journalSans(
                          fontSize: 11,
                          height: 1.4,
                          color: palette.textQuaternary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Bottom capture dock mirroring web journal.new: Record / Photo / Video.
/// Flutter web is text-first; native multimodal ships in a later phase.
class _CaptureDock extends StatelessWidget {
  const _CaptureDock({
    required this.palette,
    required this.onNativeOnly,
  });

  final JournalPalette palette;
  final VoidCallback onNativeOnly;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'OR CAPTURE',
          style: journalSans(
            fontSize: 11,
            letterSpacing: 1.5,
            color: palette.textTertiary,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _DockButton(
                palette: palette,
                icon: Icons.mic_none,
                label: 'Record',
                onTap: onNativeOnly,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _DockButton(
                palette: palette,
                icon: Icons.photo_camera_outlined,
                label: 'Photo',
                onTap: onNativeOnly,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _DockButton(
                palette: palette,
                icon: Icons.videocam_outlined,
                label: 'Video',
                onTap: onNativeOnly,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _DockButton extends StatelessWidget {
  const _DockButton({
    required this.palette,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final JournalPalette palette;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: palette.glassFill,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: palette.divider),
          ),
          child: Column(
            children: [
              Icon(icon, size: 20, color: palette.textSecondary),
              const SizedBox(height: 6),
              Text(
                label,
                style: journalSans(
                  fontSize: 12,
                  color: palette.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Sticky-style top bar: close on the left, centered title, Save pill.
class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.palette,
    required this.saving,
    required this.canSave,
    required this.onClose,
    required this.onSave,
  });

  final JournalPalette palette;
  final bool saving;
  final bool canSave;
  final VoidCallback? onClose;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: palette.divider),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          IconButton(
            onPressed: onClose,
            tooltip: 'Close',
            icon: Icon(
              Icons.close,
              color: palette.textPrimary.withValues(alpha: 0.8),
            ),
          ),
          Expanded(
            child: Text(
              'New entry',
              textAlign: TextAlign.center,
              style: journalSans(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: palette.textPrimary,
              ),
            ),
          ),
          FilledButton(
            onPressed: canSave ? onSave : null,
            style: FilledButton.styleFrom(
              shape: const StadiumBorder(),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            ),
            child: saving
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: theme.colorScheme.onPrimary,
                    ),
                  )
                : const Text('Save'),
          ),
        ],
      ),
    );
  }
}

/// Uppercase tracking label matching web `text-[11px] uppercase tracking`.
class _SectionEyebrow extends StatelessWidget {
  const _SectionEyebrow(this.text, {required this.palette});

  final String text;
  final JournalPalette palette;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: journalSans(
        fontSize: 11,
        letterSpacing: 1.5,
        color: palette.textTertiary,
      ),
    );
  }
}

class _WhenPicker extends StatelessWidget {
  const _WhenPicker({
    required this.palette,
    required this.capturedAt,
    required this.onTap,
  });

  final JournalPalette palette;
  final DateTime capturedAt;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: EdgeInsets.zero,
      borderRadius: 14,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Icon(
                Icons.schedule,
                size: 18,
                color: palette.textTertiary,
              ),
              const SizedBox(width: 10),
              Text(
                DateFormat('EEE, MMM d · h:mm a').format(capturedAt.toLocal()),
                style: journalSans(
                  fontSize: 14,
                  color: palette.textSecondary,
                ),
              ),
              const Spacer(),
              Text(
                'Change',
                style: journalSans(
                  fontSize: 11,
                  color: palette.textQuaternary,
                  decoration: TextDecoration.underline,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
