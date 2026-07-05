import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import 'care_chat_repository.dart';

/// Renders a persisted care-chat attachment: image thumbnail or file row.
/// Fetches a short-lived signed URL (300s TTL) via the repository.
///
/// Note: sending/adding attachments is deferred to Wave 3 (needs a native
/// picker). This widget only renders attachments already stored on messages.
class CareAttachmentView extends ConsumerStatefulWidget {
  const CareAttachmentView({
    super.key,
    required this.threadId,
    required this.attachment,
    required this.mine,
  });

  final String threadId;
  final CareAttachment attachment;
  final bool mine;

  @override
  ConsumerState<CareAttachmentView> createState() => _CareAttachmentViewState();
}

class _CareAttachmentViewState extends ConsumerState<CareAttachmentView> {
  String? _url;
  bool _loading = false;
  bool _failed = false;

  Future<String?> _resolveUrl() async {
    if (_url != null) return _url;
    if (_loading) return null;
    setState(() => _loading = true);
    try {
      final url = await ref.read(careChatRepositoryProvider).attachmentUrl(
            threadId: widget.threadId,
            path: widget.attachment.path,
          );
      if (mounted) {
        setState(() {
          _url = url;
          _loading = false;
        });
      }
      return url;
    } catch (_) {
      if (mounted) {
        setState(() {
          _failed = true;
          _loading = false;
        });
      }
      return null;
    }
  }

  @override
  void initState() {
    super.initState();
    if (widget.attachment.kind == 'image') {
      // Eagerly resolve so the thumbnail can render inline.
      WidgetsBinding.instance.addPostFrameCallback((_) => _resolveUrl());
    }
  }

  Future<void> _open() async {
    final url = await _resolveUrl();
    if (url == null) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.attachment;
    if (a.kind == 'image') {
      return GestureDetector(
        onTap: _open,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 220, maxWidth: 240),
            child: _failed || _url == null
                ? Container(
                    width: 160,
                    height: 120,
                    color: Colors.white.withValues(alpha: 0.08),
                    alignment: Alignment.center,
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(Icons.broken_image_outlined,
                            color: Colors.white.withValues(alpha: 0.5)),
                  )
                : Image.network(
                    _url!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 160,
                      height: 120,
                      color: Colors.white.withValues(alpha: 0.08),
                      alignment: Alignment.center,
                      child: Icon(Icons.broken_image_outlined,
                          color: Colors.white.withValues(alpha: 0.5)),
                    ),
                  ),
          ),
        ),
      );
    }

    final sizeMb = (a.size / 1024 / 1024).toStringAsFixed(2);
    final fg = widget.mine
        ? Theme.of(context).colorScheme.onPrimary
        : Colors.white.withValues(alpha: 0.92);
    return InkWell(
      onTap: _open,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.description_outlined, size: 18, color: fg),
            const SizedBox(width: 8),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(a.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: fg, fontSize: 13)),
                  Text('$sizeMb MB',
                      style: TextStyle(
                          color: fg.withValues(alpha: 0.6), fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(width: 6),
            _loading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : Icon(Icons.download_outlined, size: 16, color: fg),
          ],
        ),
      ),
    );
  }
}
