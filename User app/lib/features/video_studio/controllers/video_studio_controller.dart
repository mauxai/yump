import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/video_studio/models/video_models.dart';
import 'package:lumen/features/video_studio/repo/video_studio_repo.dart';

class VideoStudioController extends GetxController implements GetxService {
  final VideoStudioRepo _repo;

  VideoStudioController({required VideoStudioRepo repo}) : _repo = repo;

  List<VideoModelDefinition> models = VideoModelDefinition.defaultModels;
  VideoModelDefinition selectedModel = VideoModelDefinition.defaultModels.first;

  String selectedAspectRatio = '16:9';
  int selectedDuration = 5;
  String? sourceImageBase64;
  File? sourceImageFile;

  bool isGenerating = false;
  bool isLoadingGallery = false;
  List<VideoRecord> videoGallery = [];

  Timer? _pollingTimer;

  @override
  void onInit() {
    super.onInit();
    loadVideoModels();
    loadGallery();
  }

  Future<void> loadVideoModels() async {
    final response = await _repo.fetchVideoModels();
    if (response.statusCode == 200 && response.body != null && response.body['models'] != null) {
      final list = response.body['models'] as List;
      models = list.map((e) => VideoModelDefinition.fromJson(e)).toList();
      if (models.isNotEmpty) {
        selectedModel = models.firstWhere((m) => m.key == selectedModel.key, orElse: () => models.first);
        _syncConstraints();
      }
      update();
    }
  }

  void selectModel(VideoModelDefinition model) {
    selectedModel = model;
    _syncConstraints();
    update();
  }

  void _syncConstraints() {
    // If selected aspect ratio not supported, reset to default
    if (!selectedModel.aspectRatios.contains(selectedAspectRatio)) {
      selectedAspectRatio = selectedModel.defaultAspectRatio;
    }
    // If selected duration not in model durations, reset to first
    if (!selectedModel.durations.contains(selectedDuration)) {
      selectedDuration = selectedModel.durations.first;
    }
    // If model does not support image-to-video, clear image
    if (!selectedModel.supportsI2V) {
      clearSourceImage();
    }
  }

  void selectAspectRatio(String ratio) {
    if (selectedModel.aspectRatios.contains(ratio)) {
      selectedAspectRatio = ratio;
      update();
    }
  }

  void selectDuration(int duration) {
    if (selectedModel.durations.contains(duration)) {
      selectedDuration = duration;
      update();
    }
  }

  Future<void> setSourceImage(File file) async {
    sourceImageFile = file;
    final bytes = await file.readAsBytes();
    final ext = file.path.split('.').last.toLowerCase();
    final mime = ext == 'png' ? 'image/png' : ext == 'webp' ? 'image/webp' : 'image/jpeg';
    sourceImageBase64 = 'data:$mime;base64,${base64Encode(bytes)}';
    update();
  }

  void clearSourceImage() {
    sourceImageFile = null;
    sourceImageBase64 = null;
    update();
  }

  Future<void> generateVideo(String prompt, {String? negativePrompt}) async {
    if (prompt.trim().isEmpty) {
      showCustomSnackBar('prompt_required'.tr);
      return;
    }

    final profileCtrl = Get.find<ProfileController>();
    if (profileCtrl.user == null) {
      await profileCtrl.fetchProfile();
    }
    final creditsLeft = (profileCtrl.user?.creditsTotal ?? 0) - (profileCtrl.user?.creditsUsed ?? 0);
    if (creditsLeft < selectedModel.creditCost) {
      showCustomSnackBar('insufficient_credits_for_video'.tr);
      return;
    }

    isGenerating = true;
    update();

    final response = await _repo.generateVideo(
      prompt: prompt.trim(),
      negativePrompt: negativePrompt,
      sourceImageUrl: sourceImageBase64,
      aspectRatio: selectedAspectRatio,
      modelKey: selectedModel.key,
      duration: selectedDuration,
    );

    isGenerating = false;

    if (response.statusCode == 200 && response.body != null && response.body['video'] != null) {
      final video = VideoRecord.fromJson(response.body['video']);
      videoGallery.insert(0, video);
      clearSourceImage();
      showCustomSnackBar('video_generation_started'.tr, isError: false);
      profileCtrl.fetchProfile();
      _startPolling();
      update();
    } else {
      final err = response.body?['error'] ?? 'video_generation_failed'.tr;
      showCustomSnackBar(err);
      update();
    }
  }

  Future<void> loadGallery() async {
    isLoadingGallery = true;
    update();

    final response = await _repo.fetchVideoGallery();
    if (response.statusCode == 200 && response.body != null && response.body['items'] != null) {
      final list = response.body['items'] as List;
      videoGallery = list.map((e) => VideoRecord.fromJson(e)).toList();

      if (videoGallery.any((v) => v.isProcessing)) {
        _startPolling();
      }
    }

    isLoadingGallery = false;
    update();
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (timer) async {
      final processingVideos = videoGallery.where((v) => v.isProcessing).toList();
      if (processingVideos.isEmpty) {
        timer.cancel();
        return;
      }

      for (final v in processingVideos) {
        final res = await _repo.checkVideoStatus(v.id);
        if (res.statusCode == 200 && res.body != null && res.body['video'] != null) {
          final updated = VideoRecord.fromJson(res.body['video']);
          final idx = videoGallery.indexWhere((item) => item.id == v.id);
          if (idx != -1) {
            videoGallery[idx] = updated;
            if (updated.isCompleted) {
              showCustomSnackBar('video_completed'.tr, isError: false);
            } else if (updated.isFailed) {
              showCustomSnackBar('video_failed_refunded'.tr);
              Get.find<ProfileController>().fetchProfile();
            }
          }
        }
      }
      update();
    });
  }

  Future<void> deleteVideo(String id) async {
    final response = await _repo.deleteVideo(id);
    if (response.statusCode == 200) {
      videoGallery.removeWhere((v) => v.id == id);
      showCustomSnackBar('video_deleted'.tr, isError: false);
      update();
    } else {
      showCustomSnackBar('failed_to_delete_video'.tr);
    }
  }

  @override
  void onClose() {
    _pollingTimer?.cancel();
    super.onClose();
  }
}
