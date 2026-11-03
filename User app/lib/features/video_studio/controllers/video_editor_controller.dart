import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:gal/gal.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/video_studio/models/video_editor_models.dart';
import 'package:lumen/features/video_studio/repo/video_editor_repo.dart';
import 'package:lumen/helper/notification_helper.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';

class EditorHistorySnapshot {
  final List<TimelineClipModel> clips;
  final List<TextOverlayModel> textOverlays;
  final String soundtrackUrl;
  final double soundtrackVolume;
  final int soundtrackStartOffset;
  final String soundtrackFade;
  final WatermarkModel? watermark;
  final int selectedClipIndex;

  EditorHistorySnapshot({
    required this.clips,
    required this.textOverlays,
    required this.soundtrackUrl,
    required this.soundtrackVolume,
    required this.soundtrackStartOffset,
    required this.soundtrackFade,
    this.watermark,
    required this.selectedClipIndex,
  });
}

class VideoEditorController extends GetxController implements GetxService {
  final VideoEditorRepo videoEditorRepo;
  VideoEditorController({required this.videoEditorRepo});

  final List<TimelineClipModel> _clips = [];
  List<TimelineClipModel> get clips => _clips;

  int _selectedClipIndex = 0;
  int get selectedClipIndex => _selectedClipIndex;

  // --- CapCut-Grade Undo / Redo History Stack ---
  final List<EditorHistorySnapshot> _undoStack = [];
  final List<EditorHistorySnapshot> _redoStack = [];

  bool get canUndo => _undoStack.isNotEmpty;
  bool get canRedo => _redoStack.isNotEmpty;

  void _pushHistory() {
    _redoStack.clear();
    _undoStack.add(
      EditorHistorySnapshot(
        clips: _clips.map((c) => c.copyWith()).toList(),
        textOverlays: _textOverlays.map((t) => TextOverlayModel.fromJson(t.toJson())).toList(),
        soundtrackUrl: _soundtrackUrl,
        soundtrackVolume: _soundtrackVolume,
        soundtrackStartOffset: _soundtrackStartOffset,
        soundtrackFade: _soundtrackFade,
        watermark: _watermark != null
            ? WatermarkModel(
                url: _watermark!.url,
                position: _watermark!.position,
                opacity: _watermark!.opacity,
                scale: _watermark!.scale,
              )
            : null,
        selectedClipIndex: _selectedClipIndex,
      ),
    );
    if (_undoStack.length > 30) {
      _undoStack.removeAt(0);
    }
  }

  void undo() {
    if (!canUndo) return;
    _redoStack.add(
      EditorHistorySnapshot(
        clips: _clips.map((c) => c.copyWith()).toList(),
        textOverlays: _textOverlays.map((t) => TextOverlayModel.fromJson(t.toJson())).toList(),
        soundtrackUrl: _soundtrackUrl,
        soundtrackVolume: _soundtrackVolume,
        soundtrackStartOffset: _soundtrackStartOffset,
        soundtrackFade: _soundtrackFade,
        watermark: _watermark != null
            ? WatermarkModel(
                url: _watermark!.url,
                position: _watermark!.position,
                opacity: _watermark!.opacity,
                scale: _watermark!.scale,
              )
            : null,
        selectedClipIndex: _selectedClipIndex,
      ),
    );

    final snapshot = _undoStack.removeLast();
    _restoreFromSnapshot(snapshot);
  }

  void redo() {
    if (!canRedo) return;
    _undoStack.add(
      EditorHistorySnapshot(
        clips: _clips.map((c) => c.copyWith()).toList(),
        textOverlays: _textOverlays.map((t) => TextOverlayModel.fromJson(t.toJson())).toList(),
        soundtrackUrl: _soundtrackUrl,
        soundtrackVolume: _soundtrackVolume,
        soundtrackStartOffset: _soundtrackStartOffset,
        soundtrackFade: _soundtrackFade,
        watermark: _watermark != null
            ? WatermarkModel(
                url: _watermark!.url,
                position: _watermark!.position,
                opacity: _watermark!.opacity,
                scale: _watermark!.scale,
              )
            : null,
        selectedClipIndex: _selectedClipIndex,
      ),
    );

    final snapshot = _redoStack.removeLast();
    _restoreFromSnapshot(snapshot);
  }

  void _restoreFromSnapshot(EditorHistorySnapshot snapshot) {
    _clips.clear();
    _clips.addAll(snapshot.clips);
    _textOverlays.clear();
    _textOverlays.addAll(snapshot.textOverlays);
    _soundtrackUrl = snapshot.soundtrackUrl;
    _soundtrackVolume = snapshot.soundtrackVolume;
    _soundtrackStartOffset = snapshot.soundtrackStartOffset;
    _soundtrackFade = snapshot.soundtrackFade;
    _watermark = snapshot.watermark;
    _selectedClipIndex = snapshot.selectedClipIndex.clamp(0, _clips.isEmpty ? 0 : _clips.length - 1);
    if (_clips.isNotEmpty) {
      initPlayerForClip(_selectedClipIndex);
    } else {
      _disposePlayer();
    }
    update();
  }

  final List<TextOverlayModel> _textOverlays = [];
  List<TextOverlayModel> get textOverlays => _textOverlays;

  WatermarkModel? _watermark;
  WatermarkModel? get watermark => _watermark;

  String _selectedAspectRatio = '16:9';
  String get selectedAspectRatio => _selectedAspectRatio;

  String _selectedResolution = 'hd';
  String get selectedResolution => _selectedResolution;

  String _selectedFormat = 'mp4';
  String get selectedFormat => _selectedFormat;

  String _title = 'My Video Edit';
  String get title => _title;

  String _soundtrackUrl = '';
  String get soundtrackUrl => _soundtrackUrl;

  double _soundtrackVolume = 0.5;
  double get soundtrackVolume => _soundtrackVolume;

  int _soundtrackStartOffset = 0;
  int get soundtrackStartOffset => _soundtrackStartOffset;

  String _soundtrackFade = 'none';
  String get soundtrackFade => _soundtrackFade;

  bool _isRendering = false;
  bool get isRendering => _isRendering;

  int _activeRenderStage = 1;
  int get activeRenderStage => _activeRenderStage;

  int _pollingTickCount = 0;

  bool _isUploading = false;
  bool get isUploading => _isUploading;

  bool _isLoadingHistory = false;
  bool get isLoadingHistory => _isLoadingHistory;

  bool _isDownloading = false;
  bool get isDownloading => _isDownloading;

  bool _isSharing = false;
  bool get isSharing => _isSharing;

  final List<VideoEditRecordModel> _editHistory = [];
  List<VideoEditRecordModel> get editHistory => _editHistory;

  VideoEditRecordModel? _activeEdit;
  VideoEditRecordModel? get activeEdit => _activeEdit;

  Timer? _statusPollingTimer;

  // --- Timeline Multi-Track Zoom & Playhead State ---
  double _timelineZoom = 24.0; // pixels per second
  double get timelineZoom => _timelineZoom;

  void setTimelineZoom(double zoom) {
    _timelineZoom = zoom.clamp(12.0, 60.0);
    update();
  }

  void zoomIn() => setTimelineZoom(_timelineZoom + 6.0);
  void zoomOut() => setTimelineZoom(_timelineZoom - 6.0);

  double get totalTimelineDuration {
    return _clips.fold(0.0, (sum, c) => sum + c.length);
  }

  double get globalPlayheadSeconds {
    double elapsed = 0.0;
    for (int i = 0; i < _selectedClipIndex && i < _clips.length; i++) {
      elapsed += _clips[i].length;
    }
    if (playerController != null && _isPlayerInitialized) {
      final clipSec = virtualCurrentPosition.inMilliseconds / 1000.0;
      elapsed += clipSec;
    }
    return elapsed;
  }

  void seekGlobalTimeline(double targetSeconds) {
    if (_clips.isEmpty) return;
    double accumulated = 0.0;
    for (int i = 0; i < _clips.length; i++) {
      final clipLen = _clips[i].length.toDouble();
      if (targetSeconds <= accumulated + clipLen || i == _clips.length - 1) {
        final offsetInClip = (targetSeconds - accumulated).clamp(0.0, clipLen);
        if (_selectedClipIndex != i) {
          selectClip(i);
        }
        seekToVirtual(Duration(milliseconds: (offsetInClip * 1000).round()));
        return;
      }
      accumulated += clipLen;
    }
  }

  // --- Inline Video Player Engine (A/B Dual-Player Ping-Pong Pipeline) ---
  VideoPlayerController? _playerA;
  VideoPlayerController? get playerA => _playerA;

  VideoPlayerController? _playerB;
  VideoPlayerController? get playerB => _playerB;

  int _activePlayerSlot = 0; // 0 for A, 1 for B
  int get activePlayerSlot => _activePlayerSlot;

  VideoPlayerController? get playerController => _activePlayerSlot == 0 ? _playerA : _playerB;

  VideoPlayerController? _soundtrackPlayer;
  VideoPlayerController? get soundtrackPlayer => _soundtrackPlayer;
  Timer? _driftMonitorTimer;

  bool _isPlaying = false;
  bool get isPlaying => _isPlaying;

  bool _isPlayerInitialized = false;
  bool get isPlayerInitialized => _isPlayerInitialized;

  bool _isLoopSeeking = false;
  bool get isLoopSeeking => _isLoopSeeking;

  bool _isPlayAllSequence = false;
  bool get isPlayAllSequence => _isPlayAllSequence;

  bool _isPlayerMuted = false;
  bool get isPlayerMuted => _isPlayerMuted;

  Duration _currentPosition = Duration.zero;
  Duration get currentPosition => _currentPosition;

  Duration _clipDuration = Duration.zero;
  Duration get clipDuration => _clipDuration;

  Duration get virtualCurrentPosition {
    if (_clips.isEmpty || _selectedClipIndex >= _clips.length || !_isPlayerInitialized) {
      return Duration.zero;
    }
    final clip = _clips[_selectedClipIndex];
    final trimMs = (clip.trim * 1000).round();
    final curMs = _currentPosition.inMilliseconds;
    if (curMs < trimMs) return Duration.zero;
    final inClipMs = curMs - trimMs;
    final maxMs = (clip.length * 1000).round();
    return Duration(milliseconds: inClipMs.clamp(0, maxMs));
  }

  Duration get virtualClipDuration {
    if (_clips.isEmpty || _selectedClipIndex >= _clips.length) {
      return _clipDuration;
    }
    return Duration(milliseconds: (_clips[_selectedClipIndex].length * 1000).round());
  }

  double get normalizedClipProgress {
    final durMs = virtualClipDuration.inMilliseconds;
    if (durMs <= 0) return 0.0;
    return (virtualCurrentPosition.inMilliseconds / durMs).clamp(0.0, 1.0);
  }

  @override
  void onInit() {
    super.onInit();
    loadEditHistory();
  }

  @override
  void onClose() {
    _statusPollingTimer?.cancel();
    _driftMonitorTimer?.cancel();
    _disposePlayer();
    super.onClose();
  }

  void _disposePlayer() {
    _driftMonitorTimer?.cancel();
    _driftMonitorTimer = null;
    _playerA?.removeListener(_onPlayerTick);
    _playerA?.dispose();
    _playerA = null;
    _playerB?.removeListener(_onPlayerTick);
    _playerB?.dispose();
    _playerB = null;
    _soundtrackPlayer?.dispose();
    _soundtrackPlayer = null;
    _isPlayerInitialized = false;
    _isPlaying = false;
    _isLoopSeeking = false;
  }

  Future<void> initPlayerForClip(int clipIndex) async {
    if (clipIndex < 0 || clipIndex >= _clips.length) return;
    final clip = _clips[clipIndex];
    final hasLocal = clip.localPath != null && File(clip.localPath!).existsSync();
    if (clip.isImage || (!hasLocal && clip.videoUrl.isEmpty)) {
      _disposePlayer();
      update();
      return;
    }

    _disposePlayer();
    update();

    try {
      final VideoPlayerController controller;
      if (hasLocal) {
        controller = VideoPlayerController.file(File(clip.localPath!));
      } else {
        controller = VideoPlayerController.networkUrl(Uri.parse(clip.videoUrl));
      }
      await controller.initialize();
      _activePlayerSlot = 0;
      _playerA = controller;
      _isPlayerInitialized = true;
      _clipDuration = controller.value.duration;
      controller.setVolume(_isPlayerMuted ? 0.0 : (clip.volume ?? 1.0));
      controller.setPlaybackSpeed(clip.speed);
      if (clip.trim > 0) {
        await controller.seekTo(Duration(milliseconds: (clip.trim * 1000).round()));
      }
      controller.addListener(_onPlayerTick);

      // Preload next clip on player B
      if (_clips.length > 1) {
        _preloadSlot(1, (clipIndex + 1) % _clips.length);
      }
      update();
    } catch (e) {
      debugPrint('Error initializing inline player: $e');
      _isPlayerInitialized = false;
      update();
    }
  }

  Future<void> _preloadSlot(int slot, int clipIndex) async {
    if (clipIndex < 0 || clipIndex >= _clips.length) return;
    final clip = _clips[clipIndex];
    final hasLocal = clip.localPath != null && File(clip.localPath!).existsSync();
    if (clip.isImage || (!hasLocal && clip.videoUrl.isEmpty)) {
      if (slot == 0) {
        _playerA?.removeListener(_onPlayerTick);
        _playerA?.dispose();
        _playerA = null;
      } else {
        _playerB?.removeListener(_onPlayerTick);
        _playerB?.dispose();
        _playerB = null;
      }
      return;
    }

    try {
      final VideoPlayerController controller;
      if (hasLocal) {
        controller = VideoPlayerController.file(File(clip.localPath!));
      } else {
        controller = VideoPlayerController.networkUrl(Uri.parse(clip.videoUrl));
      }
      await controller.initialize();
      controller.setVolume(_isPlayerMuted ? 0.0 : (clip.volume ?? 1.0));
      controller.setPlaybackSpeed(clip.speed);
      if (clip.trim > 0) {
        await controller.seekTo(Duration(milliseconds: (clip.trim * 1000).round()));
      }
      controller.addListener(_onPlayerTick);

      if (slot == 0) {
        _playerA?.removeListener(_onPlayerTick);
        _playerA?.dispose();
        _playerA = controller;
      } else {
        _playerB?.removeListener(_onPlayerTick);
        _playerB?.dispose();
        _playerB = controller;
      }
    } catch (e) {
      debugPrint('Error preloading slot $slot: $e');
    }
  }

  void _advanceToNextClip(int nextIndex) {
    if (nextIndex < 0 || nextIndex >= _clips.length) return;
    final nextClip = _clips[nextIndex];
    final inactiveSlot = 1 - _activePlayerSlot;
    final inactive = inactiveSlot == 0 ? _playerA : _playerB;

    if (inactive != null && inactive.value.isInitialized && !nextClip.isImage) {
      // Stop current player
      playerController?.pause();
      // Fast A/B Ping-Pong swap
      _activePlayerSlot = inactiveSlot;
      _selectedClipIndex = nextIndex;
      _isPlayerInitialized = true;
      _currentPosition = inactive.value.position;
      inactive.setPlaybackSpeed(nextClip.speed);
      inactive.setVolume(_isPlayerMuted ? 0.0 : (nextClip.volume ?? 1.0));
      inactive.play();
      _isPlaying = true;

      // Preload next clip on the now-inactive slot
      if (_clips.length > 1) {
        final nextNextIndex = (nextIndex + 1) % _clips.length;
        _preloadSlot(1 - _activePlayerSlot, nextNextIndex);
      }
    } else {
      selectClip(nextIndex);
      playerController?.play();
    }
    _syncSoundtrackToVideo();
  }

  void _onPlayerTick() {
    final active = playerController;
    if (active == null || !_isPlayerInitialized) return;
    _currentPosition = active.value.position;
    final playing = active.value.isPlaying;
    if (_isPlaying != playing) {
      _isPlaying = playing;
      if (_isPlaying) {
        _soundtrackPlayer?.play();
      } else {
        _soundtrackPlayer?.pause();
      }
    }

    if (_clips.isNotEmpty && _selectedClipIndex < _clips.length) {
      final clip = _clips[_selectedClipIndex];
      final posMs = _currentPosition.inMilliseconds;
      final trimStartMs = (clip.trim * 1000).round();
      final trimEndMs = ((clip.trim + clip.length) * 1000).round();

      // Pre-emptive loop / advance trigger 40ms before physical cut point
      if (posMs >= trimEndMs - 40 && !_isLoopSeeking) {
        if (_isPlayAllSequence && _clips.length > 1) {
          final nextIndex = (_selectedClipIndex + 1) % _clips.length;
          _advanceToNextClip(nextIndex);
        } else {
          _isLoopSeeking = true;
          active.seekTo(Duration(milliseconds: trimStartMs)).then((_) {
            _isLoopSeeking = false;
            if (_isPlaying) {
              active.play();
            }
          });
          _syncSoundtrackToVideo();
        }
      }
    }
    update();
  }

  void togglePlayPause() {
    final active = playerController;
    if (active == null || !_isPlayerInitialized) return;
    if (active.value.isPlaying) {
      active.pause();
      _soundtrackPlayer?.pause();
    } else {
      active.play();
      _soundtrackPlayer?.play();
    }
    _isPlaying = active.value.isPlaying;
    update();
  }

  void seekToVirtual(Duration position) {
    final active = playerController;
    if (active == null || !_isPlayerInitialized) return;
    final clip = _clips.isNotEmpty && _selectedClipIndex < _clips.length ? _clips[_selectedClipIndex] : null;
    final trimMs = clip != null ? (clip.trim * 1000).round() : 0;
    final targetMs = trimMs + position.inMilliseconds;
    final rawTarget = Duration(milliseconds: targetMs);
    active.seekTo(rawTarget);
    _currentPosition = rawTarget;
    _syncSoundtrackToVideo();
    update();
  }

  void seekTo(Duration position) {
    seekToVirtual(position);
  }

  void toggleMute() {
    _isPlayerMuted = !_isPlayerMuted;
    final active = playerController;
    if (active != null && _isPlayerInitialized) {
      final currentClip = _clips.isNotEmpty && _selectedClipIndex < _clips.length ? _clips[_selectedClipIndex] : null;
      active.setVolume(_isPlayerMuted ? 0.0 : (currentClip?.volume ?? 1.0));
    }
    update();
  }

  void togglePlayAllSequence() {
    _isPlayAllSequence = !_isPlayAllSequence;
    update();
  }

  void init({String? initialVideoUrl}) {
    if (initialVideoUrl != null && initialVideoUrl.trim().isNotEmpty) {
      final trimmed = initialVideoUrl.trim();
      final alreadyAdded = _clips.any((c) => c.videoUrl == trimmed);
      if (!alreadyAdded) {
        addClip(trimmed);
      }
    }
    loadEditHistory();
  }

  void setTitle(String value) {
    _title = value;
    update();
  }

  void setAspectRatio(String ratio) {
    _selectedAspectRatio = ratio;
    update();
  }

  void setResolution(String res) {
    _selectedResolution = res;
    update();
  }

  void setFormat(String fmt) {
    _selectedFormat = fmt;
    update();
  }

  void selectClip(int index) {
    if (index >= 0 && index < _clips.length) {
      _selectedClipIndex = index;
      initPlayerForClip(index);
      update();
    }
  }

  void setSoundtrack(String url, {double? volume, int? startOffset, String? fade}) {
    _soundtrackUrl = url;
    if (volume != null) _soundtrackVolume = volume;
    if (startOffset != null) _soundtrackStartOffset = startOffset;
    if (fade != null) _soundtrackFade = fade;

    _initSoundtrackPlayer();
    update();
  }

  void _initSoundtrackPlayer() {
    _driftMonitorTimer?.cancel();
    _soundtrackPlayer?.dispose();
    _soundtrackPlayer = null;
    if (_soundtrackUrl.isEmpty) return;

    try {
      final uri = Uri.parse(_soundtrackUrl);
      final sp = VideoPlayerController.networkUrl(uri);
      sp.initialize().then((_) {
        _soundtrackPlayer = sp;
        sp.setVolume(_soundtrackVolume);
        sp.setLooping(true);
        _syncSoundtrackToVideo();
        if (_isPlaying) {
          sp.play();
        }
        _startDriftMonitor();
        update();
      }).catchError((e) {
        debugPrint('Error initializing soundtrack player: $e');
      });
    } catch (e) {
      debugPrint('Error starting soundtrack player: $e');
    }
  }

  void _startDriftMonitor() {
    _driftMonitorTimer?.cancel();
    _driftMonitorTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      _checkAudioDrift();
    });
  }

  void _checkAudioDrift() {
    if (_soundtrackPlayer == null || !_soundtrackPlayer!.value.isInitialized || !_isPlaying) return;

    final expectedMs = ((globalPlayheadSeconds + _soundtrackStartOffset) * 1000).round();
    final durationMs = _soundtrackPlayer!.value.duration.inMilliseconds;
    if (durationMs <= 0) return;
    final clampedExpectedMs = expectedMs % durationMs;
    final actualMs = _soundtrackPlayer!.value.position.inMilliseconds;

    // Hard seek only if drift exceeds 350ms to prevent jitter clicks and audible skips
    if ((actualMs - clampedExpectedMs).abs() > 350) {
      _soundtrackPlayer!.seekTo(Duration(milliseconds: clampedExpectedMs));
    }
  }

  void _syncSoundtrackToVideo() {
    if (_soundtrackPlayer == null || !_soundtrackPlayer!.value.isInitialized) return;
    final expectedMs = ((globalPlayheadSeconds + _soundtrackStartOffset) * 1000).round();
    final durationMs = _soundtrackPlayer!.value.duration.inMilliseconds;
    if (durationMs > 0) {
      _soundtrackPlayer!.seekTo(Duration(milliseconds: expectedMs % durationMs));
    }
  }

  void removeSoundtrack() {
    _driftMonitorTimer?.cancel();
    _driftMonitorTimer = null;
    _soundtrackPlayer?.dispose();
    _soundtrackPlayer = null;
    _soundtrackUrl = '';
    _soundtrackStartOffset = 0;
    _soundtrackFade = 'none';
    update();
  }

  void setWatermark({
    required String url,
    String position = 'topRight',
    double opacity = 0.85,
    double scale = 0.15,
  }) {
    _watermark = WatermarkModel(url: url, position: position, opacity: opacity, scale: scale);
    update();
  }

  void removeWatermark() {
    _watermark = null;
    update();
  }

  void addClip(String url, {double length = 5.0, bool isImage = false, String? localPath}) {
    _pushHistory();
    final clip = TimelineClipModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      videoUrl: url,
      localPath: localPath,
      length: length,
      isImage: isImage,
      effect: isImage ? 'zoomIn' : null,
      transitionIn: _clips.isNotEmpty ? 'fade' : null,
    );
    _clips.add(clip);
    _selectedClipIndex = _clips.length - 1;
    initPlayerForClip(_selectedClipIndex);
    update();
  }

  void removeClip(int index) {
    if (index >= 0 && index < _clips.length) {
      _pushHistory();
      _clips.removeAt(index);
      if (_selectedClipIndex >= _clips.length) {
        _selectedClipIndex = _clips.isEmpty ? 0 : _clips.length - 1;
      }
      if (_clips.isNotEmpty) {
        initPlayerForClip(_selectedClipIndex);
      } else {
        _disposePlayer();
      }
      update();
    }
  }

  void reorderClips(int oldIndex, int newIndex) {
    _pushHistory();
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final item = _clips.removeAt(oldIndex);
    _clips.insert(newIndex, item);
    _selectedClipIndex = newIndex;
    update();
  }

  void splitClip(int index, double atSeconds) {
    if (index < 0 || index >= _clips.length) return;
    _pushHistory();
    final clip = _clips[index];
    final splitTime = atSeconds.clamp(0.1, clip.length > 0.2 ? clip.length - 0.1 : 0.1);
    final remainingLength = clip.length - splitTime;

    if (remainingLength <= 0.05) return;

    clip.length = double.parse(splitTime.toStringAsFixed(2));

    final secondPart = clip.copyWith(
      id: '${DateTime.now().millisecondsSinceEpoch}_split',
      trim: double.parse((clip.trim + splitTime).toStringAsFixed(2)),
      length: double.parse(remainingLength.toStringAsFixed(2)),
      transitionIn: null,
    );

    _clips.insert(index + 1, secondPart);
    _selectedClipIndex = index;
    initPlayerForClip(_selectedClipIndex);
    showCustomSnackBar('clip_split_success'.tr, isError: false);
    update();
  }

  void duplicateClip(int index) {
    if (index < 0 || index >= _clips.length) return;
    _pushHistory();
    final clip = _clips[index];
    final cloned = clip.copyWith(
      id: '${DateTime.now().millisecondsSinceEpoch}_dup',
    );
    _clips.insert(index + 1, cloned);
    _selectedClipIndex = index + 1;
    initPlayerForClip(_selectedClipIndex);
    showCustomSnackBar('clip_duplicated'.tr, isError: false);
    update();
  }

  void updateClipDuration(int index, double newLength) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].length = newLength;
      update();
    }
  }

  void updateClipTrim(int index, double trim) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].trim = trim;
      update();
    }
  }

  void updateClipTrimRange(int index, double trim, double length) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].trim = trim;
      _clips[index].length = length;
      update();
    }
  }

  void setClipTransitionIn(int index, String? transition) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].transitionIn = transition?.isEmpty == true ? null : transition;
      update();
    }
  }

  void setClipTransitionOut(int index, String? transition) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].transitionOut = transition?.isEmpty == true ? null : transition;
      update();
    }
  }

  void setClipFilter(int index, String? filter) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].filter = filter?.isEmpty == true ? null : filter;
      update();
    }
  }

  void setClipMotionEffect(int index, String? effect) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].effect = effect?.isEmpty == true ? null : effect;
      update();
    }
  }

  void setClipFit(int index, String? fit) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].fit = fit?.isEmpty == true ? null : fit;
      update();
    }
  }

  void setClipSpeed(int index, double speed) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].speed = speed;
      if (index == _selectedClipIndex && playerController != null && _isPlayerInitialized) {
        playerController!.setPlaybackSpeed(speed);
      }
      update();
    }
  }

  void setClipVolume(int index, double volume) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].volume = volume;
      if (index == _selectedClipIndex && playerController != null && _isPlayerInitialized) {
        playerController!.setVolume(_isPlayerMuted ? 0.0 : volume);
      }
      update();
    }
  }

  void addTextOverlay(
    String text, {
    String position = 'bottom',
    String style = 'minimal',
    String size = 'medium',
    String color = '#ffffff',
    String? background,
    int start = 0,
    int length = 3,
  }) {
    final overlay = TextOverlayModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: text,
      position: position,
      style: style,
      size: size,
      color: color,
      background: background,
      start: start,
      length: length,
    );
    _textOverlays.add(overlay);
    update();
  }

  void updateTextOverlay(
    int index, {
    required String text,
    String? position,
    String? style,
    String? size,
    String? color,
    String? background,
    int? start,
    int? length,
  }) {
    if (index >= 0 && index < _textOverlays.length) {
      final item = _textOverlays[index];
      item.text = text;
      if (position != null) item.position = position;
      if (style != null) item.style = style;
      if (size != null) item.size = size;
      if (color != null) item.color = color;
      item.background = background;
      if (start != null) item.start = start;
      if (length != null) item.length = length;
      update();
    }
  }

  void removeTextOverlay(int index) {
    if (index >= 0 && index < _textOverlays.length) {
      _textOverlays.removeAt(index);
      update();
    }
  }

  Future<String?> uploadMediaFile(String filePath, {required bool isAudio}) async {
    _isUploading = true;
    update();

    try {
      final response = await videoEditorRepo.uploadMedia(
        filePath: filePath,
        mediaType: isAudio ? 'audio' : 'video',
      );

      if (response.statusCode == 200 && response.body != null && response.body['url'] != null) {
        return response.body['url'] as String;
      } else {
        showCustomSnackBar(response.body?['error'] ?? 'upload_failed'.tr);
        return null;
      }
    } catch (e) {
      showCustomSnackBar('upload_failed'.tr);
      return null;
    } finally {
      _isUploading = false;
      update();
    }
  }

  Future<void> submitRender({String? resolution, String? format, String? aspectRatio}) async {
    if (_clips.isEmpty) {
      showCustomSnackBar('please_add_clip'.tr);
      return;
    }

    _isRendering = true;
    _activeRenderStage = 1;
    _pollingTickCount = 0;
    update();

    // Ensure all local clips are uploaded before submitting to Shotstack
    for (int i = 0; i < _clips.length; i++) {
      final c = _clips[i];
      if (c.localPath != null && (c.videoUrl.isEmpty || !c.videoUrl.startsWith('http'))) {
        final uploaded = await uploadMediaFile(c.localPath!, isAudio: false);
        if (uploaded != null) {
          c.videoUrl = uploaded;
        } else {
          showCustomSnackBar('Failed to upload clip #${i + 1}');
          _isRendering = false;
          update();
          return;
        }
      }
    }

    final clipPayload = _clips.map((c) => c.toJson()).toList();
    final textPayload = _textOverlays.map((t) => t.toJson()).toList();

    try {
      final response = await videoEditorRepo.renderVideoEdit(
        title: _title.trim().isEmpty ? 'My Video Edit' : _title.trim(),
        clips: clipPayload,
        soundtrackUrl: _soundtrackUrl.trim().isEmpty ? null : _soundtrackUrl.trim(),
        soundtrackVolume: _soundtrackVolume,
        soundtrackStart: _soundtrackStartOffset,
        soundtrackFade: _soundtrackFade,
        textOverlays: textPayload,
        watermarkUrl: _watermark?.url,
        watermarkPosition: _watermark?.position ?? 'topRight',
        watermarkOpacity: _watermark?.opacity ?? 0.85,
        watermarkScale: _watermark?.scale ?? 0.15,
        aspectRatio: aspectRatio ?? _selectedAspectRatio,
        resolution: resolution ?? _selectedResolution,
        format: format ?? _selectedFormat,
      );

      if (response.statusCode == 200 && response.body['success'] == true) {
        final newEdit = VideoEditRecordModel.fromJson(response.body['edit']);
        _activeEdit = newEdit;
        _editHistory.insert(0, newEdit);
        _startPolling(newEdit.id);

        if (Get.isRegistered<ProfileController>()) {
          Get.find<ProfileController>().fetchProfile();
        }

        // Navigate immediately to dedicated Render Progress View
        Get.toNamed(RouteHelper.getVideoRenderProgressRoute(newEdit.id));
      } else {
        showCustomSnackBar(response.body['error'] ?? 'video_render_failed'.tr);
        _isRendering = false;
      }
    } catch (e) {
      showCustomSnackBar('video_render_failed'.tr);
      _isRendering = false;
    }

    update();
  }

  void _startPolling(String editId) {
    _statusPollingTimer?.cancel();
    _pollingTickCount = 0;

    _statusPollingTimer = Timer.periodic(const Duration(seconds: 4), (timer) async {
      _pollingTickCount++;
      if (_pollingTickCount == 2) {
        _activeRenderStage = 2; // Downloading & preparing assets
      } else if (_pollingTickCount == 4) {
        _activeRenderStage = 3; // Stitching & transitions
      } else if (_pollingTickCount >= 6) {
        _activeRenderStage = 4; // Final audio & encoding
      }
      update();

      final response = await videoEditorRepo.checkVideoEditStatus(editId);
      if (response.statusCode == 200 && response.body['success'] == true) {
        final updated = VideoEditRecordModel.fromJson(response.body['edit']);
        _activeEdit = updated;

        final index = _editHistory.indexWhere((e) => e.id == updated.id);
        if (index != -1) {
          _editHistory[index] = updated;
        }

        if (updated.isCompleted || updated.isFailed) {
          _isRendering = false;
          timer.cancel();

          if (updated.isCompleted) {
            _activeRenderStage = 4;

            // 1. Dispatch Local OS System Notification
            NotificationHelper.showVideoRenderCompleteNotification(
              editId: updated.id,
              title: updated.title,
            );

            // 2. Navigation handling
            final currentRoute = Get.currentRoute;
            if (currentRoute.contains(RouteHelper.videoRenderProgress)) {
              Get.offNamed(RouteHelper.getVideoRenderSuccessRoute(updated.id));
            } else {
              // In-App Completion Notification Banner
              Get.snackbar(
                'render_completed_notification'.tr,
                '${updated.title}: ${'render_completed_tap_view'.tr}',
                snackPosition: SnackPosition.TOP,
                backgroundColor: Colors.black87,
                colorText: Colors.white,
                duration: const Duration(seconds: 5),
                mainButton: TextButton(
                  onPressed: () {
                    Get.toNamed(RouteHelper.getVideoRenderSuccessRoute(updated.id));
                  },
                  child: Text(
                    'view_rendered_video'.tr,
                    style: const TextStyle(color: AppColors.gradientStart, fontWeight: FontWeight.bold),
                  ),
                ),
              );
            }
          } else {
            showCustomSnackBar(updated.errorMessage ?? 'video_render_failed'.tr);
          }

          if (Get.isRegistered<ProfileController>()) {
            Get.find<ProfileController>().fetchProfile();
          }
        }
        update();
      }
    });
  }

  Future<void> downloadRenderedVideo(String videoUrl) async {
    _isDownloading = true;
    update();
    try {
      final res = await http.get(Uri.parse(videoUrl));
      final tempDir = await getTemporaryDirectory();
      final id = DateTime.now().millisecondsSinceEpoch.toString();
      final filePath = '${tempDir.path}/video_$id.mp4';
      final file = File(filePath);
      await file.writeAsBytes(res.bodyBytes);

      await Gal.putVideo(filePath);
      showCustomSnackBar('video_saved_to_gallery'.tr, isError: false);
    } catch (e) {
      showCustomSnackBar('failed_to_save_gallery'.tr);
    } finally {
      _isDownloading = false;
      update();
    }
  }

  Future<void> shareRenderedVideo(String videoUrl, String title) async {
    _isSharing = true;
    update();
    try {
      final res = await http.get(Uri.parse(videoUrl));
      final tempDir = await getTemporaryDirectory();
      final id = DateTime.now().millisecondsSinceEpoch.toString();
      final filePath = '${tempDir.path}/video_$id.mp4';
      final file = File(filePath);
      await file.writeAsBytes(res.bodyBytes);

      await Share.shareXFiles(
        [XFile(filePath)],
        text: title.isNotEmpty ? title : 'Check out my video!',
      );
    } catch (e) {
      showCustomSnackBar('Failed to share video: $e');
    } finally {
      _isSharing = false;
      update();
    }
  }

  void restoreProjectForEditing(VideoEditRecordModel record) {
    if (_clips.isEmpty && record.videoUrl != null && record.videoUrl!.isNotEmpty) {
      addClip(record.videoUrl!);
    }
    _title = record.title;
    _selectedAspectRatio = record.aspectRatio;
    _selectedResolution = record.resolution;
    Get.toNamed(RouteHelper.getVideoEditorRoute());
  }

  Future<void> loadEditHistory() async {
    _isLoadingHistory = true;
    update();

    try {
      final response = await videoEditorRepo.fetchVideoEditGallery();
      if (response.statusCode == 200 && response.body != null) {
        final List items = response.body['items'] ?? [];
        _editHistory.clear();
        for (var item in items) {
          _editHistory.add(VideoEditRecordModel.fromJson(item));
        }
        if (_editHistory.isNotEmpty && _activeEdit == null) {
          _activeEdit = _editHistory.first;
        }
      }
    } catch (e) {
      // Ignored
    } finally {
      _isLoadingHistory = false;
      update();
    }
  }

  Future<void> deleteEdit(String id) async {
    final response = await videoEditorRepo.deleteVideoEdit(id);
    if (response.statusCode == 200) {
      _editHistory.removeWhere((e) => e.id == id);
      if (_activeEdit?.id == id) {
        _activeEdit = _editHistory.isNotEmpty ? _editHistory.first : null;
      }
      showCustomSnackBar('delete_clip'.tr, isError: false);
      update();
    }
  }
}
