/// Picked file bytes for report upload.
class PickedReportFile {
  const PickedReportFile({
    required this.name,
    required this.bytes,
    required this.mimeType,
  });

  final String name;
  final List<int> bytes;
  final String mimeType;
}

/// Returns empty on platforms without a picker wired yet.
Future<List<PickedReportFile>> pickReportFiles() async => const [];
