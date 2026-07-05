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
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _scrolled = false;

  bool get _hideChrome => shellHidesChrome(widget.location);

  void _openMenu() {
    if (_hideChrome) return;
    // Defer one frame so Scaffold.endDrawer is ready on web canvases.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _hideChrome) return;
      _scaffoldKey.currentState?.openEndDrawer();
    });
  }

  @override
  void didUpdateWidget(covariant NativeAppShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.location != widget.location || _hideChrome) {
      _scaffoldKey.currentState?.closeEndDrawer();
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
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Explicit viewport sizing avoids unbounded shell height issues on web.
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: purpleCanvasDark,
      resizeToAvoidBottomInset: false,
      endDrawer: _hideChrome
          ? null
          : ShellMenuEndDrawer(location: widget.location),
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
