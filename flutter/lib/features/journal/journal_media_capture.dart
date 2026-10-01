import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import 'journal_media_bytes.dart';
import 'journal_media_file.dart';

/// User-facing capture failure (permission, size, empty clip).
class MediaCaptureException implements Exception {
  MediaCaptureException(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Camera, library, and microphone capture shared by journal and Today.
abstract class MediaCapturer {
  Future<JournalMediaFile?> pickVideo({required ImageSource source});

  bool get isRecording;

  /// Returns false when microphone permission is denied.
  Future<bool> startVoice();

  Future<JournalMediaFile?> stopVoice();

  Future<void> cancelVoice();
}

/// Production capturer. Tests replace [mediaCapturer] before a tap.
class PluginMediaCapturer implements MediaCapturer {
  PluginMediaCapturer({
    ImagePicker? picker,
    AudioRecorder? recorder,
  })  : _pickerOverride = picker,
        _recorderOverride = recorder;

  static const maxVideoBytes = 50 * 1024 * 1024;

  final ImagePicker? _pickerOverride;
  final AudioRecorder? _recorderOverride;
  ImagePicker? _picker;
  AudioRecorder? _recorder;

  ImagePicker get _imagePicker => _picker ??= _pickerOverride ?? ImagePicker();

  AudioRecorder get _audioRecorder =>
      _recorder ??= _recorderOverride ?? AudioRecorder();
  bool _recording = false;
  String _voiceExt = 'm4a';
  String _voiceMime = 'audio/mp4';

  @override
  bool get isRecording => _recording;

  @override
  Future<JournalMediaFile?> pickVideo({required ImageSource source}) async {
    final file = await _imagePicker.pickVideo(
      source: source,
      maxDuration: const Duration(seconds: 60),
    );
    if (file == null) return null;
    final bytes = await file.readAsBytes();
    if (bytes.length > maxVideoBytes) {
      throw MediaCaptureException('Video is too large (max 50 MB).');
    }
    if (bytes.isEmpty) {
      throw MediaCaptureException('That video was empty.');
    }
    final name = file.name.isEmpty ? 'clip.mp4' : file.name;
    return JournalMediaFile(
      bytes: bytes,
      fileName: name,
      mimeType: file.mimeType ?? _guessVideoMime(name),
      kind: JournalMediaKind.video,
    );
  }

  @override
  Future<bool> startVoice() async {
    if (_recording) return true;
    final allowed = await _audioRecorder.hasPermission();
    if (!allowed) return false;

    final web = kIsWeb;
    _voiceExt = web ? 'webm' : 'm4a';
    _voiceMime = web ? 'audio/webm' : 'audio/mp4';
    final encoder = web ? AudioEncoder.opus : AudioEncoder.aacLc;

    String path = 'purple-voice.$_voiceExt';
    if (!web) {
      final dir = await getTemporaryDirectory();
      path =
          '${dir.path}/purple-voice-${DateTime.now().millisecondsSinceEpoch}.$_voiceExt';
    }

    await _audioRecorder.start(
      RecordConfig(encoder: encoder),
      path: path,
    );
    _recording = true;
    return true;
  }

  @override
  Future<JournalMediaFile?> stopVoice() async {
    if (!_recording) return null;
    final path = await _audioRecorder.stop();
    _recording = false;
    if (path == null || path.isEmpty) return null;
    final bytes = await _readPath(path);
    if (bytes.isEmpty) return null;
    return JournalMediaFile(
      bytes: bytes,
      fileName: 'voice-note.$_voiceExt',
      mimeType: _voiceMime,
      kind: JournalMediaKind.voice,
    );
  }

  @override
  Future<void> cancelVoice() async {
    if (!_recording) return;
    try {
      await _audioRecorder.cancel();
    } catch (_) {
      try {
        await _audioRecorder.stop();
      } catch (_) {}
    }
    _recording = false;
  }

  Future<Uint8List> _readPath(String path) => readCapturedBytes(path);

  static String _guessVideoMime(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('.mov')) return 'video/quicktime';
    if (lower.endsWith('.webm')) return 'video/webm';
    return 'video/mp4';
  }
}

MediaCapturer? _override;
MediaCapturer? _plugin;

/// Active capturer. Widget tests assign a fake before tapping mic or video.
MediaCapturer get mediaCapturer => _override ?? (_plugin ??= PluginMediaCapturer());

set mediaCapturer(MediaCapturer? value) => _override = value;
