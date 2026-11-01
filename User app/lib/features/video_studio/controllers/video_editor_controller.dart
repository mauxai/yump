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

class VideoEditorController extends GetxController implements GetxService {
  final VideoEditorRepo videoEditorRepo;
  VideoEditorController({required this.videoEditorRepo});

  final List<TimelineClipModel> _clips = [];
  List<TimelineClipModel> get clips => _clips;

  int _selectedClipIndex = 0;
  int get selectedClipIndex => _selectedClipIndex;

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
    if (_playerController != null && _isPlayerInitialized) {
      final clipSec = _currentPosition.inMilliseconds / 1000.0;
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
        seekTo(Duration(milliseconds: (offsetInClip * 1000).round()));
        return;
      }
      accumulated += clipLen;
    }
  }

  // --- Inline Video Player Engine ---
  VideoPlayerController? _playerController;
  VideoPlayerController? get playerController => _playerController;

  bool _isPlaying = false;
  bool get isPlaying => _isPlaying;

  bool _isPlayerInitialized = false;
  bool get isPlayerInitialized => _isPlayerInitialized;

  bool _isPlayAllSequence = false;
  bool get isPlayAllSequence => _isPlayAllSequence;

  bool _isPlayerMuted = false;
  bool get isPlayerMuted => _isPlayerMuted;

  Duration _currentPosition = Duration.zero;
  Duration get currentPosition => _currentPosition;

  Duration _clipDuration = Duration.zero;
  Duration get clipDuration => _clipDuration;

  @override
  void onInit() {
    super.onInit();
    loadEditHistory();
  }

  @override
  void onClose() {
    _statusPollingTimer?.cancel();
    _disposePlayer();
    super.onClose();
  }

  void _disposePlayer() {
    _playerController?.removeListener(_onPlayerTick);
    _playerController?.dispose();
    _playerController = null;
    _isPlayerInitialized = false;
    _isPlaying = false;
  }

  Future<void> initPlayerForClip(int clipIndex) async {
    if (clipIndex < 0 || clipIndex >= _clips.length) return;
    final clip = _clips[clipIndex];
    if (clip.isImage || clip.videoUrl.isEmpty) {
      _disposePlayer();
      update();
      return;
    }

    _disposePlayer();
    update();

    try {
      final uri = Uri.parse(clip.videoUrl);
      _playerController = VideoPlayerController.networkUrl(uri);
      await _playerController!.initialize();
      _isPlayerInitialized = true;
      _clipDuration = _playerController!.value.duration;
      _playerController!.setVolume(_isPlayerMuted ? 0.0 : (clip.volume ?? 1.0));
      _playerController!.setPlaybackSpeed(clip.speed);
      if (clip.trim > 0) {
        await _playerController!.seekTo(Duration(seconds: clip.trim));
      }
      _playerController!.addListener(_onPlayerTick);
      update();
    } catch (e) {
      debugPrint('Error initializing inline player: $e');
      _isPlayerInitialized = false;
      update();
    }
  }

  void _onPlayerTick() {
    if (_playerController == null || !_isPlayerInitialized) return;
    _currentPosition = _playerController!.value.position;
    final playing = _playerController!.value.isPlaying;
    if (_isPlaying != playing) {
      _isPlaying = playing;
    }

    if (_isPlayAllSequence && _playerController!.value.position >= _playerController!.value.duration && _clips.isNotEmpty) {
      final nextIndex = (_selectedClipIndex + 1) % _clips.length;
      selectClip(nextIndex);
      _playerController?.play();
    }
    update();
  }

  void togglePlayPause() {
    if (_playerController == null || !_isPlayerInitialized) return;
    if (_playerController!.value.isPlaying) {
      _playerController!.pause();
    } else {
      _playerController!.play();
    }
    _isPlaying = _playerController!.value.isPlaying;
    update();
  }

  void seekTo(Duration position) {
    if (_playerController == null || !_isPlayerInitialized) return;
    _playerController!.seekTo(position);
    update();
  }

  void toggleMute() {
    _isPlayerMuted = !_isPlayerMuted;
    if (_playerController != null && _isPlayerInitialized) {
      final currentClip = _clips.isNotEmpty && _selectedClipIndex < _clips.length ? _clips[_selectedClipIndex] : null;
      _playerController!.setVolume(_isPlayerMuted ? 0.0 : (currentClip?.volume ?? 1.0));
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
    update();
  }

  void removeSoundtrack() {
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

  void addClip(String url, {int length = 5, bool isImage = false}) {
    final clip = TimelineClipModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      videoUrl: url,
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
    final clip = _clips[index];
    final splitTime = atSeconds.round().clamp(1, clip.length > 1 ? clip.length - 1 : 1);
    final remainingLength = clip.length - splitTime;

    if (remainingLength <= 0) return;

    clip.length = splitTime;

    final secondPart = clip.copyWith(
      id: '${DateTime.now().millisecondsSinceEpoch}_split',
      trim: clip.trim + splitTime,
      length: remainingLength,
      transitionIn: 'fade',
    );

    _clips.insert(index + 1, secondPart);
    _selectedClipIndex = index;
    initPlayerForClip(_selectedClipIndex);
    showCustomSnackBar('clip_split_success'.tr, isError: false);
    update();
  }

  void duplicateClip(int index) {
    if (index < 0 || index >= _clips.length) return;
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

  void updateClipDuration(int index, int newLength) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].length = newLength;
      update();
    }
  }

  void updateClipTrim(int index, int trim) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].trim = trim;
      update();
    }
  }

  void updateClipTrimRange(int index, int trim, int length) {
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
      if (index == _selectedClipIndex && _playerController != null && _isPlayerInitialized) {
        _playerController!.setPlaybackSpeed(speed);
      }
      update();
    }
  }

  void setClipVolume(int index, double volume) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].volume = volume;
      if (index == _selectedClipIndex && _playerController != null && _isPlayerInitialized) {
        _playerController!.setVolume(_isPlayerMuted ? 0.0 : volume);
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
