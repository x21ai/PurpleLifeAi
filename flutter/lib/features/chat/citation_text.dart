import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:url_launcher/url_launcher.dart';

/// Renders assistant text as Markdown, splitting out `[Source: Title (Year)](url)`
/// citations into tappable / muted pills (mirrors web `renderWithSourceCitations`).
class CitationText extends StatelessWidget {
  const CitationText({super.key, required this.text});

  final String text;

  static final _citationRe = RegExp(
    r'\[Source:\s*([^\]]+)\]\((https?:\/\/[^)]+)\)|\[Source:\s*([^\]]+)\]',
  );

  @override
  Widget build(BuildContext context) {
    final segments = <Widget>[];
    var last = 0;
    for (final match in _citationRe.allMatches(text)) {
      if (match.start > last) {
        segments.add(_markdown(context, text.substring(last, match.start)));
      }
      final label = (match.group(1) ?? match.group(3) ?? '').trim();
      final href = match.group(2);
      segments.add(_CitationPill(label: label, url: href));
      last = match.end;
    }
    if (last < text.length) {
      segments.add(_markdown(context, text.substring(last)));
    }
    if (segments.isEmpty) {
      segments.add(_markdown(context, text));
    }

    // Pills are inline in web; here we lay segments out in a Wrap so pills sit
    // alongside the surrounding markdown without breaking the glass bubble.
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 4,
      runSpacing: 4,
      children: segments,
    );
  }

  Widget _markdown(BuildContext context, String md) {
    final trimmed = md.trim();
    if (trimmed.isEmpty) return const SizedBox.shrink();
    final base = Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.92),
          height: 1.45,
        );
    return MarkdownBody(
      data: trimmed,
      shrinkWrap: true,
      onTapLink: (text, href, title) => _open(href),
      styleSheet: MarkdownStyleSheet(
        p: base,
        listBullet: base,
        a: base?.copyWith(
          color: Theme.of(context).colorScheme.primary,
          decoration: TextDecoration.underline,
        ),
        strong: base?.copyWith(fontWeight: FontWeight.w600),
        em: base?.copyWith(fontStyle: FontStyle.italic),
        code: base?.copyWith(fontFamily: 'monospace'),
      ),
    );
  }

  static Future<void> _open(String? href) async {
    if (href == null || href.isEmpty) return;
    final uri = Uri.tryParse(href);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class _CitationPill extends StatelessWidget {
  const _CitationPill({required this.label, this.url});

  final String label;
  final String? url;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final hasUrl = url != null && url!.isNotEmpty;
    final pill = Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: hasUrl
            ? primary.withValues(alpha: 0.12)
            : Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: hasUrl
              ? primary.withValues(alpha: 0.3)
              : Colors.white.withValues(alpha: 0.12),
        ),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: hasUrl ? primary : Colors.white.withValues(alpha: 0.6),
              fontWeight: FontWeight.w500,
            ),
      ),
    );
    if (!hasUrl) return pill;
    return Semantics(
      link: true,
      label: label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: () => CitationText._open(url),
          child: pill,
        ),
      ),
    );
  }
}
