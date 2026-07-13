import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../design/glass_surface.dart';
import '../shared/glass_helpers.dart' hide GlassSurface;
import 'journal_media_file.dart';
import 'journal_repository.dart';
import 'journal_style.dart';

/// Journal capture flow mirroring web `journal.new.tsx` (standard dark theme
/// canvas): sticky bar (close, title, Save pill), "when" picker, serif text
/// card, photo attach, offline queue note.
///
/// Shell strips [MediaQuery.padding] for full-bleed routes; this screen must
/// pad with [MediaQuery.viewPadding] or Save draws under the status bar
/// (TF feedback: submit unreachable).
class JournalCaptureScreen extends ConsumerStatefulWidget {
  const JournalCaptureScreen({super.key});

  @override
  ConsumerState<JournalCaptureScreen> createState() =>
      _JournalCaptureScreenState();
}

class _JournalCaptureScreenState extends ConsumerState<JournalCaptureScreen> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  final _picker = ImagePicker();
  DateTime _capturedAt = DateTime.now();
  bool _saving = false;
  final List<JournalMediaFile> _media = [];

  static const _maxPhotos = 6;
  static const _maxBytes = 12 * 1024 * 1024;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  bool get _hasContent =>
      _controller.text.trim().isNotEmpty || _media.isNotEmpty;

  void _dismissKeyboard() {
    _focusNode.unfocus();
    FocusManager.instance.primaryFocus?.unfocus();
  }

  Future<void> _save() async {
    if (!_hasContent || _saving) return;
    _dismissKeyboard();

    setState(() => _saving = true);
    try {
      final repository = ref.read(journalRepositoryProvider);
      await repository.saveEntry(
        text: _controller.text,
        capturedAt: _capturedAt,
        media: List<JournalMediaFile>.from(_media),
      );
      ref.invalidate(journalDataProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Entry saved')),
      );
      context.go('/journal');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e is StateError
                  ? e.message
                  : "Your entry didn't save. It's still here on this screen, try again in a moment.",
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickDate() async {
    _dismissKeyboard();
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

  Future<void> _addPhoto(ImageSource source) async {
    _dismissKeyboard();
    if (_media.length >= _maxPhotos) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You can attach up to 6 photos.')),
      );
      return;
    }
    try {
      final file = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 2400,
      );
      if (file == null || !mounted) return;
      final bytes = await file.readAsBytes();
      if (bytes.length > _maxBytes) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo is too large (max 12 MB).')),
        );
        return;
      }
      final mime = file.mimeType ?? _guessMime(file.name);
      setState(() {
        _media.add(
          JournalMediaFile(
            bytes: bytes,
            fileName: file.name,
            mimeType: mime,
          ),
        );
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Couldn't open the camera or photo library."),
        ),
      );
    }
  }

  void _removePhoto(int index) {
    setState(() => _media.removeAt(index));
  }

  Future<void> _showPhotoSheet() async {
    _dismissKeyboard();
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF1A1520),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        final palette = JournalPalette.dark();
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Icon(Icons.photo_camera_outlined,
                    color: palette.textPrimary),
                title: Text(
                  'Take photo',
                  style: journalSans(color: palette.textPrimary),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _addPhoto(ImageSource.camera);
                },
              ),
              ListTile(
                leading:
                    Icon(Icons.photo_library_outlined, color: palette.textPrimary),
                title: Text(
                  'Choose from library',
                  style: journalSans(color: palette.textPrimary),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _addPhoto(ImageSource.gallery);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  static String _guessMime(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic')) return 'image/heic';
    return 'image/jpeg';
  }

  @override
  Widget build(BuildContext context) {
    final palette = JournalPalette.dark();
    // Shell removes MediaQuery.padding; viewPadding still reflects the notch.
    // Nested Scaffold restores Material for InkWell/IconButton and respects
    // keyboard viewInsets (shell uses resizeToAvoidBottomInset: false).
    final viewPadding = MediaQuery.viewPaddingOf(context);
    return CanvasBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        resizeToAvoidBottomInset: true,
        body: Padding(
          padding: EdgeInsets.only(
            top: viewPadding.top,
            bottom: viewPadding.bottom,
            left: viewPadding.left,
            right: viewPadding.right,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _TopBar(
              palette: palette,
              saving: _saving,
              canSave: _hasContent && !_saving,
              onClose: _saving
                  ? null
                  : () {
                      _dismissKeyboard();
                      context.go('/journal');
                    },
                onSave: _save,
                onDismissKeyboard: _dismissKeyboard,
              ),
              Expanded(
                child: GestureDetector(
                  onTap: _dismissKeyboard,
                  behavior: HitTestBehavior.translucent,
                  child: SingleChildScrollView(
                    keyboardDismissBehavior:
                        ScrollViewKeyboardDismissBehavior.onDrag,
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
                            borderRadius: BorderRadius.circular(20),
                            padding: const EdgeInsets.all(20),
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(minHeight: 220),
                              child: TextField(
                                controller: _controller,
                                focusNode: _focusNode,
                                maxLines: null,
                                minLines: 8,
                                textAlignVertical: TextAlignVertical.top,
                                textInputAction: TextInputAction.newline,
                                style: journalSerif(
                                  fontSize: 18,
                                  height: 1.5,
                                  color: palette.textPrimary
                                      .withValues(alpha: 0.92),
                                ),
                                decoration: InputDecoration(
                                  hintText:
                                      'What is happening, or what just happened?',
                                  hintStyle: journalSans(
                                    fontSize: 16,
                                    color: palette.textPrimary
                                        .withValues(alpha: 0.4),
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
                          if (_media.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            _PhotoPreviewStrip(
                              palette: palette,
                              media: _media,
                              onRemove: _removePhoto,
                            ),
                          ],
                          const SizedBox(height: 16),
                          _CaptureDock(
                            palette: palette,
                            photoCount: _media.length,
                            maxPhotos: _maxPhotos,
                            onPhoto: _showPhotoSheet,
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
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PhotoPreviewStrip extends StatelessWidget {
  const _PhotoPreviewStrip({
    required this.palette,
    required this.media,
    required this.onRemove,
  });

  final JournalPalette palette;
  final List<JournalMediaFile> media;
  final ValueChanged<int> onRemove;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: media.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final file = media[index];
          return Stack(
            clipBehavior: Clip.none,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.memory(
                  file.bytes,
                  width: 88,
                  height: 88,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                top: -6,
                right: -6,
                child: IconButton(
                  onPressed: () => onRemove(index),
                  tooltip: 'Remove photo',
                  style: IconButton.styleFrom(
                    backgroundColor: palette.surface,
                    foregroundColor: palette.textPrimary,
                    minimumSize: const Size(32, 32),
                    padding: EdgeInsets.zero,
                  ),
                  icon: const Icon(Icons.close, size: 16),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Photo attach (working) plus honest voice/video coming-soon note.
class _CaptureDock extends StatelessWidget {
  const _CaptureDock({
    required this.palette,
    required this.photoCount,
    required this.maxPhotos,
    required this.onPhoto,
  });

  final JournalPalette palette;
  final int photoCount;
  final int maxPhotos;
  final VoidCallback onPhoto;

  @override
  Widget build(BuildContext context) {
    final photoLabel =
        photoCount == 0 ? 'Photo' : 'Photo ($photoCount/$maxPhotos)';
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
                icon: Icons.photo_camera_outlined,
                label: photoLabel,
                subtitle: 'Camera or library',
                enabled: photoCount < maxPhotos,
                onTap: onPhoto,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _DockButton(
                palette: palette,
                icon: Icons.mic_none,
                label: 'Record',
                subtitle: 'Coming soon',
                enabled: false,
                onTap: null,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _DockButton(
                palette: palette,
                icon: Icons.videocam_outlined,
                label: 'Video',
                subtitle: 'Coming soon',
                enabled: false,
                onTap: null,
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
    required this.subtitle,
    required this.enabled,
    required this.onTap,
  });

  final JournalPalette palette;
  final IconData icon;
  final String label;
  final String subtitle;
  final bool enabled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.55,
      child: Material(
        color: palette.glassFill,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: enabled ? onTap : null,
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
                  textAlign: TextAlign.center,
                  style: journalSans(
                    fontSize: 12,
                    color: palette.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  textAlign: TextAlign.center,
                  style: journalSans(
                    fontSize: 10,
                    color: palette.textQuaternary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Sticky-style top bar: close on the left, centered title, Save pill.
/// Save uses explicit palette colors so it stays visible on the dark canvas
/// even when the ambient Theme is light or partially stripped.
class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.palette,
    required this.saving,
    required this.canSave,
    required this.onClose,
    required this.onSave,
    required this.onDismissKeyboard,
  });

  final JournalPalette palette;
  final bool saving;
  final bool canSave;
  final VoidCallback? onClose;
  final VoidCallback onSave;
  final VoidCallback onDismissKeyboard;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: palette.divider),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Row(
        children: [
          IconButton(
            onPressed: onClose,
            tooltip: 'Close',
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            icon: Icon(
              Icons.close,
              color: palette.textPrimary.withValues(alpha: 0.8),
            ),
          ),
          IconButton(
            onPressed: onDismissKeyboard,
            tooltip: 'Dismiss keyboard',
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            icon: Icon(
              Icons.keyboard_hide_outlined,
              color: palette.textTertiary,
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
              backgroundColor: palette.purplePrimary,
              disabledBackgroundColor:
                  palette.purplePrimary.withValues(alpha: 0.35),
              foregroundColor: Colors.white,
              disabledForegroundColor: Colors.white.withValues(alpha: 0.7),
              minimumSize: const Size(72, 44),
              shape: const StadiumBorder(),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            ),
            child: saving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
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
      borderRadius: BorderRadius.circular(14),
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
                  color: palette.textTertiary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
