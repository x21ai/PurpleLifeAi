import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import 'report_file_picker.dart';
import 'reports_repository.dart';

/// Lab report upload mirroring web `/reports/new` (storage + document row).
class ReportsUploadScreen extends ConsumerStatefulWidget {
  const ReportsUploadScreen({super.key});

  @override
  ConsumerState<ReportsUploadScreen> createState() => _ReportsUploadScreenState();
}

class _ReportsUploadScreenState extends ConsumerState<ReportsUploadScreen> {
  final _files = <PickedReportFile>[];
  bool _uploading = false;
  String? _error;

  Future<void> _pickFiles() async {
    setState(() => _error = null);
    final picked = await pickReportFiles();
    if (!mounted || picked.isEmpty) return;
    setState(() => _files.addAll(picked));
  }

  void _removeAt(int index) {
    setState(() => _files.removeAt(index));
  }

  Future<void> _upload() async {
    if (_files.isEmpty || _uploading) return;
    setState(() {
      _uploading = true;
      _error = null;
    });

    try {
      final repo = ref.read(reportsRepositoryProvider);
      var ok = 0;
      for (final file in _files) {
        await repo.uploadReport(
          filename: file.name,
          bytes: file.bytes,
          mimeType: file.mimeType,
        );
        ok++;
      }
      ref.invalidate(reportsHubProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            ok == 1
                ? 'Report uploaded. Purple is reading it now.'
                : '$ok reports uploaded. Purple is reading them now.',
          ),
        ),
      );
      context.go(AppRoutes.settingsReports);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e is StateError
              ? e.message
              : 'Upload did not finish. Try again in a moment.';
        });
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: _uploading ? null : () => context.go(AppRoutes.settingsReports),
                icon: Icon(
                  Icons.arrow_back,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
                label: Text(
                  'Reports',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'UPLOAD',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Add a lab\nreport',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'PDF or photo, up to 15 MB each. Purple extracts metrics for trends. Educational only, not medical advice.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.65),
                      height: 1.5,
                    ),
              ),
              const SizedBox(height: 24),
              GlassSurface(
                borderRadius: 20,
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    OutlinedButton.icon(
                      onPressed: _uploading ? null : _pickFiles,
                      icon: const Icon(Icons.upload_file_outlined),
                      label: const Text('Choose files'),
                    ),
                    if (_files.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      for (var i = 0; i < _files.length; i++)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Icon(
                                Icons.description_outlined,
                                size: 18,
                                color: Colors.white.withValues(alpha: 0.6),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  _files[i].name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: Colors.white.withValues(alpha: 0.85),
                                      ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              IconButton(
                                onPressed: _uploading ? null : () => _removeAt(i),
                                icon: Icon(
                                  Icons.close,
                                  size: 18,
                                  color: Colors.white.withValues(alpha: 0.5),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _uploading || _files.isEmpty ? null : _upload,
                      child: _uploading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(
                              _files.isEmpty
                                  ? 'Upload'
                                  : 'Upload ${_files.length} file${_files.length == 1 ? '' : 's'}',
                            ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _error!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: const Color(0xFFFF8A80),
                              height: 1.35,
                            ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
