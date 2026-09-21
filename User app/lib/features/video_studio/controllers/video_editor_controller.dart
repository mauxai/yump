import 'dart:async';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/video_studio/models/video_editor_models.dart';
import 'package:lumen/features/video_studio/repo/video_editor_repo.dart';

class VideoEditorController extends GetxController implements GetxService {
  final VideoEditorRepo videoEditorRepo;
  VideoEditorController({required this.videoEditorRepo});

  final List<TimelineClipModel> _clips = [];
  List<TimelineClipModel> get clips => _clips;

  int _selectedClipIndex = 0;
  int get selectedClipIndex => _selectedClipIndex;

  final List<TextOverlayModel> _textOverlays = [];
  List<TextOverlayModel> get textOverlays => _textOverlays;

  String _selectedAspectRatio = '16:9';
  String get selectedAspectRatio => _selectedAspectRatio;

  String _title = 'My Video Edit';
  String get title => _title;

  String _soundtrackUrl = '';
  String get soundtrackUrl => _soundtrackUrl;

  double _soundtrackVolume = 0.5;
  double get soundtrackVolume => _soundtrackVolume;

  bool _isRendering = false;
  bool get isRendering => _isRendering;

  bool _isUploading = false;
  bool get isUploading => _isUploading;

  bool _isLoadingHistory = false;
  bool get isLoadingHistory => _isLoadingHistory;

  final List<VideoEditRecordModel> _editHistory = [];
  List<VideoEditRecordModel> get editHistory => _editHistory;

  VideoEditRecordModel? _activeEdit;
  VideoEditRecordModel? get activeEdit => _activeEdit;

  Timer? _statusPollingTimer;

  @override
  void onInit() {
    super.onInit();
    loadEditHistory();
  }

  @override
  void onClose() {
    _statusPollingTimer?.cancel();
    super.onClose();
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

  void selectClip(int index) {
    if (index >= 0 && index < _clips.length) {
      _selectedClipIndex = index;
      update();
    }
  }

  void setSoundtrack(String url, {double? volume}) {
    _soundtrackUrl = url;
    if (volume != null) _soundtrackVolume = volume;
    update();
  }

  void removeSoundtrack() {
    _soundtrackUrl = '';
    update();
  }

  void addClip(String url, {int length = 5}) {
    final clip = TimelineClipModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      videoUrl: url,
      length: length,
      transitionIn: _clips.isNotEmpty ? 'fade' : null,
    );
    _clips.add(clip);
    _selectedClipIndex = _clips.length - 1;
    update();
  }

  void removeClip(int index) {
    if (index >= 0 && index < _clips.length) {
      _clips.removeAt(index);
      if (_selectedClipIndex >= _clips.length) {
        _selectedClipIndex = _clips.isEmpty ? 0 : _clips.length - 1;
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

  void setClipTransition(int index, String? transition) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].transitionIn = transition?.isEmpty == true ? null : transition;
      update();
    }
  }

  void setClipFilter(int index, String? filter) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].filter = filter?.isEmpty == true ? null : filter;
      update();
    }
  }

  void setClipVolume(int index, double volume) {
    if (index >= 0 && index < _clips.length) {
      _clips[index].volume = volume;
      update();
    }
  }

  void addTextOverlay(
    String text, {
    String position = 'bottom',
    String style = 'minimal',
    String color = '#ffffff',
    int start = 0,
    int length = 3,
  }) {
    final overlay = TextOverlayModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: text,
      position: position,
      style: style,
      color: color,
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
    String? color,
    int? start,
    int? length,
  }) {
    if (index >= 0 && index < _textOverlays.length) {
      final item = _textOverlays[index];
      item.text = text;
      if (position != null) item.position = position;
      if (style != null) item.style = style;
      if (color != null) item.color = color;
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

  Future<void> submitRender() async {
    if (_clips.isEmpty) {
      showCustomSnackBar('please_add_clip'.tr);
      return;
    }

    _isRendering = true;
    update();

    final clipPayload = _clips.map((c) => c.toJson()).toList();
    final textPayload = _textOverlays.map((t) => t.toJson()).toList();

    try {
      final response = await videoEditorRepo.renderVideoEdit(
        title: _title.trim().isEmpty ? 'My Video Edit' : _title.trim(),
        clips: clipPayload,
        soundtrackUrl: _soundtrackUrl.trim().isEmpty ? null : _soundtrackUrl.trim(),
        soundtrackVolume: _soundtrackVolume,
        textOverlays: textPayload,
        aspectRatio: _selectedAspectRatio,
        resolution: 'hd',
      );

      if (response.statusCode == 200 && response.body['success'] == true) {
        final newEdit = VideoEditRecordModel.fromJson(response.body['edit']);
        _activeEdit = newEdit;
        _editHistory.insert(0, newEdit);
        showCustomSnackBar('video_render_dispatched'.tr, isError: false);
        _startPolling(newEdit.id);

        if (Get.isRegistered<ProfileController>()) {
          Get.find<ProfileController>().fetchProfile();
        }
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
    _statusPollingTimer = Timer.periodic(const Duration(seconds: 4), (timer) async {
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
            showCustomSnackBar('video_render_success'.tr, isError: false);
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
