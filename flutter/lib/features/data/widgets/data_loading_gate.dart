import 'dart:async';

import 'package:flutter/material.dart';

import '../../shared/glass_helpers.dart';
import '../../shared/loading_skeleton.dart';
import '../data_providers.dart';
import 'data_load_error.dart';

/// Loading skeleton with a max duration, then a retry CTA instead of infinite spin.
class DataLoadingGate extends StatefulWidget {
  const DataLoadingGate({
    super.key,
    required this.onRetry,
    this.maxDuration = dataLoadingSkeletonMax,
  });

  final VoidCallback onRetry;
  final Duration maxDuration;

  @override
  State<DataLoadingGate> createState() => _DataLoadingGateState();
}

class _DataLoadingGateState extends State<DataLoadingGate> {
  Timer? _timer;
  bool _timedOut = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer(widget.maxDuration, () {
      if (mounted) setState(() => _timedOut = true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_timedOut) {
      return ContentColumn(
        child: DataLoadErrorCard(
          onRetry: widget.onRetry,
          body: 'This is taking longer than expected. Pull to refresh or retry.',
        ),
      );
    }

    return const ContentColumn(
      child: LoadingSkeleton(sectionTitle: 'Your data', tileCount: 5),
    );
  }
}
