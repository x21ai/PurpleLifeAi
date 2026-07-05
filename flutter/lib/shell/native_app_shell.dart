import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../design/purple_theme.dart';
import '../features/shared/glass_helpers.dart';
import 'bottom_nav.dart';
import 'offline_banner.dart';
import 'routes.dart';
import 'shell_menu_sheet.dart';
import 'top_bar.dart';

/// Routes that own full viewport height (no tab bar, top bar, or FAB).
const _fullBleedRoutes = [
  AppRoutes.journalNew,
  AppRoutes.welcome,
  AppRoutes.chat,
  AppRoutes.chatCare,
];

bool shellHidesChrome(String location) {
  return _fullBleedRoutes.any(
    (route) => location == route || location.startsWith('$route/'),
  );
}

/// Native iOS/Android shell: h-dvh equivalent, scroll in body, safe areas.
class NativeAppShell extends StatefulWidget {
  const NativeAppShell({
    super.key,
    required this.location,
    required this.child,
  });

  final String location;
  final Widget child;

  @override
  State<NativeAppShell> createState() => _NativeAppShellState();
}

class _NativeAppShellState extends State<NativeAppShell> {
  bool _scrolled = false;
  bool _menuOpen = false;

  bool get _hideChrome => shellHidesChrome(widget.location);

  static const _topBarHeight = 48.0;

  void _openMenu() {
    if (_hideChrome || _menuOpen) return;
    setState(() => _menuOpen = true);
  }

  void _closeMenu() {
    if (!_menuOpen) return;
    setState(() => _menuOpen = false);
  }

  @override
  void didUpdateWidget(covariant NativeAppShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_menuOpen && (oldWidget.location != widget.location || _hideChrome)) {
      _menuOpen = false;
    }
  }

  bool _handleScroll(ScrollNotification notification) {
    if (notification is ScrollUpdateNotification ||
        notification is ScrollMetricsNotification) {
      final next = notification.metrics.pixels > 6;
      if (next != _scrolled) {
        setState(() => _scrolled = next);
      }
    }
    return false;
  }

  double _shellHeight(BoxConstraints constraints, BuildContext context) {
    if (constraints.maxHeight.isFinite && constraints.maxHeight > 0) {
      return constraints.maxHeight;
    }
    return MediaQuery.sizeOf(context).height;
  }

  Widget _buildMenuOverlay(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final topOffset = mediaQuery.padding.top + _topBarHeight;
    final panelWidth = shellMenuDrawerWidth(mediaQuery.size.width);
    final panelHeight = math.max(0.0, mediaQuery.size.height - topOffset);

    return Positioned.fill(
      child: IgnorePointer(
        ignoring: !_menuOpen,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 170),
          curve: Curves.easeOut,
          opacity: _menuOpen ? 1 : 0,
          child: Stack(
            children: [
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: _closeMenu,
                child: ColoredBox(color: Colors.black.withValues(alpha: 0.4)),
              ),
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: EdgeInsets.only(top: topOffset),
                  child: AnimatedSlide(
                    duration: const Duration(milliseconds: 220),
                    curve: Curves.easeOutCubic,
                    offset: _menuOpen ? Offset.zero : const Offset(1, 0),
                    child: SizedBox(
                      width: panelWidth,
                      height: panelHeight,
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onHorizontalDragEnd: (details) {
                          if ((details.primaryVelocity ?? 0) > 260) {
                            _closeMenu();
                          }
                        },
                        child: ShellMenuPanel(
                          location: widget.location,
                          onDismiss: _closeMenu,
                        ),
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

  Widget _buildShellBody(BuildContext context, BoxConstraints constraints) {
    final tabInset = _hideChrome ? 0.0 : shellTabBarInset(context);
    final height = _shellHeight(constraints, context);

    return SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(
        clipBehavior: Clip.none,
        fit: StackFit.expand,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const OfflineBanner(),
              if (!_hideChrome)
                TopBar(
                  scrolled: _scrolled,
                  onMenuTap: _openMenu,
                ),
              Expanded(
                child: NotificationListener<ScrollNotification>(
                  onNotification: _handleScroll,
                  child: MediaQuery.removePadding(
                    context: context,
                    removeTop: true,
                    removeBottom: true,
                    child: Padding(
                      padding: EdgeInsets.only(bottom: tabInset),
                      child: widget.child,
                    ),
                  ),
                ),
              ),
            ],
          ),
          if (!_hideChrome)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: BottomNav(location: widget.location),
            ),
          if (!_hideChrome) _buildMenuOverlay(context),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Explicit viewport sizing avoids unbounded shell height issues on web.
    return Scaffold(
      backgroundColor: purpleCanvasDark,
      resizeToAvoidBottomInset: false,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const ColoredBox(color: CanvasBackground.canvasColor),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: Alignment(0, -0.85),
                radius: 1.2,
                colors: [CanvasBackground.gradientCenter, Colors.transparent],
                stops: [0, 0.58],
              ),
            ),
          ),
          LayoutBuilder(
            builder: (context, constraints) =>
                _buildShellBody(context, constraints),
          ),
        ],
      ),
    );
  }
}
