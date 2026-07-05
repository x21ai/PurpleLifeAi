import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../shared/glass_helpers.dart';

/// Horizontal date strip ported from `src/components/today/date-strip.tsx`:
/// 7 past days + today + 7 future days (future disabled at 30% opacity),
/// today centered on load, 56x72 rounded-18 tiles with a weekday eyebrow over
/// a serif day numeral; selected tile gets a primary ring and glow. The
/// header row shows the selected `MMM d`, a "Today" pill when off-today, and
/// a calendar picker.
class DateStrip extends StatefulWidget {
  const DateStrip({
    super.key,
    required this.value,
    required this.onChanged,
    this.daysBack = 7,
    this.daysForward = 7,
  });

  final DateTime value;
  final ValueChanged<DateTime> onChanged;
  final int daysBack;
  final int daysForward;

  @override
  State<DateStrip> createState() => _DateStripState();
}

class _DateStripState extends State<DateStrip> {
  static const _tileWidth = 56.0;
  static const _tileGap = 8.0;
  static const _tileExtent = _tileWidth + _tileGap;

  final ScrollController _controller = ScrollController();
  bool _didInitialCenter = false;

  DateTime get _today => _startOfDay(DateTime.now());

  static DateTime _startOfDay(DateTime d) => DateTime(d.year, d.month, d.day);

  List<DateTime> get _days {
    final today = _today;
    return [
      for (var i = widget.daysBack; i >= 1; i--)
        today.subtract(Duration(days: i)),
      today,
      for (var i = 1; i <= widget.daysForward; i++)
        today.add(Duration(days: i)),
    ];
  }

  int _indexOf(DateTime day) {
    final days = _days;
    for (var i = 0; i < days.length; i++) {
      if (_isSameDay(days[i], day)) return i;
    }
    return widget.daysBack;
  }

  static bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  @override
  void didUpdateWidget(covariant DateStrip oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_isSameDay(oldWidget.value, widget.value)) {
      _centerIndex(_indexOf(_startOfDay(widget.value)), animate: true);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// With edge padding of (viewport/2 - tile/2), tile i centers at offset
  /// i * tileExtent, matching the web scroll-to-center behavior.
  void _centerIndex(int index, {required bool animate}) {
    if (!_controller.hasClients) return;
    final target = (index * _tileExtent)
        .clamp(0.0, _controller.position.maxScrollExtent);
    if (animate) {
      _controller.animateTo(
        target,
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOutCubic,
      );
    } else {
      _controller.jumpTo(target);
    }
  }

  Future<void> _openPicker() async {
    final today = _today;
    final picked = await showDatePicker(
      context: context,
      initialDate: _startOfDay(widget.value),
      firstDate: today.subtract(const Duration(days: 365 * 5)),
      lastDate: today,
    );
    if (picked != null) widget.onChanged(_startOfDay(picked));
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);
    final selected = _startOfDay(widget.value);
    final today = _today;
    final isToday = _isSameDay(selected, today);
    final days = _days;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                DateFormat('MMM d').format(selected),
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFF2F2F5),
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ),
            if (!isToday) ...[
              _GlassPillButton(
                onTap: () => widget.onChanged(today),
                child: const Text(
                  'Today',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFFF2F2F5),
                  ),
                ),
              ),
              const SizedBox(width: 6),
            ],
            _GlassPillButton(
              onTap: _openPicker,
              semanticLabel: 'Pick a date',
              child: Icon(
                Icons.calendar_today_outlined,
                size: 14,
                color: Colors.white.withValues(alpha: 0.55),
              ),
            ),
          ],
        ),
        SizedBox(height: tokens.spacing.md),
        SizedBox(
          height: 72,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final edgePad =
                  math.max(0.0, constraints.maxWidth / 2 - _tileWidth / 2);
              if (!_didInitialCenter) {
                _didInitialCenter = true;
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    _centerIndex(_indexOf(selected), animate: false);
                  }
                });
              }
              return ListView.separated(
                controller: _controller,
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.symmetric(horizontal: edgePad),
                itemCount: days.length,
                separatorBuilder: (_, __) => const SizedBox(width: _tileGap),
                itemBuilder: (context, index) {
                  final day = days[index];
                  return _DayTile(
                    day: day,
                    isSelected: _isSameDay(day, selected),
                    isToday: _isSameDay(day, today),
                    isFuture: day.isAfter(today),
                    purple: purple,
                    onTap: () => widget.onChanged(day),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

class _DayTile extends StatelessWidget {
  const _DayTile({
    required this.day,
    required this.isSelected,
    required this.isToday,
    required this.isFuture,
    required this.purple,
    required this.onTap,
  });

  final DateTime day;
  final bool isSelected;
  final bool isToday;
  final bool isFuture;
  final Color purple;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final eyebrow = isToday ? 'TODAY' : DateFormat('EEE').format(day).toUpperCase();
    final highlightEyebrow = isSelected && isToday;

    Widget tile = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          eyebrow,
          style: TextStyle(
            fontSize: 10,
            letterSpacing: 1.2,
            fontWeight: highlightEyebrow ? FontWeight.w600 : FontWeight.w400,
            color: highlightEyebrow
                ? purple
                : Colors.white.withValues(alpha: 0.55),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${day.day}',
          style: TextStyle(
            fontFamily: PurpleType.serif,
            fontSize: 20,
            color: isSelected && !isFuture
                ? const Color(0xFFF2F2F5)
                : Colors.white.withValues(alpha: 0.55),
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );

    if (isSelected && !isFuture) {
      tile = DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: purple.withValues(alpha: 0.4)),
          boxShadow: [
            BoxShadow(
              color: purple.withValues(alpha: 0.15),
              blurRadius: 24,
            ),
          ],
        ),
        child: GlassSurface(
          borderRadius: 18,
          padding: EdgeInsets.zero,
          child: SizedBox(width: 54, height: 70, child: tile),
        ),
      );
    } else {
      tile = GlassSurface(
        borderRadius: 18,
        padding: EdgeInsets.zero,
        child: SizedBox(width: 56, height: 72, child: tile),
      );
      if (isFuture) tile = Opacity(opacity: 0.3, child: tile);
    }

    return SizedBox(
      width: 56,
      height: 72,
      child: isFuture
          ? tile
          : Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(18),
                splashColor: Colors.white.withValues(alpha: 0.06),
                highlightColor: Colors.white.withValues(alpha: 0.04),
                child: tile,
              ),
            ),
    );
  }
}

class _GlassPillButton extends StatelessWidget {
  const _GlassPillButton({
    required this.onTap,
    required this.child,
    this.semanticLabel,
  });

  final VoidCallback onTap;
  final Widget child;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return Semantics(
      button: true,
      label: semanticLabel,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(tokens.radius.pill),
          child: Container(
            constraints: const BoxConstraints(minHeight: 28, minWidth: 28),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: parseTokenColor(tokens.glassFor('dark').fillThin),
              borderRadius: BorderRadius.circular(tokens.radius.pill),
              border: Border.all(
                color: parseTokenColor(tokens.glassFor('dark').border),
                width: tokens.glassFor('dark').borderWidthPx,
              ),
            ),
            child: Center(widthFactor: 1, child: child),
          ),
        ),
      ),
    );
  }
}
