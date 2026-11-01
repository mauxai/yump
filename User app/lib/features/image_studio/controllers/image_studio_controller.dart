import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/image_studio/models/image_models.dart';
import 'package:lumen/features/image_studio/repo/image_studio_repo.dart';

class ImageStudioController extends GetxController implements GetxService {
  final ImageStudioRepo _repo;

  ImageStudioController({required ImageStudioRepo repo}) : _repo = repo;

  List<ImageModelDefinition> models = ImageModelDefinition.fallbackModels;
  ImageModelDefinition selectedModel = ImageModelDefinition.fallbackModels.first;

  String selectedAspectRatio = '1:1';
  bool isGenerating = false;
  bool isLoadingGallery = false;
  List<ImageGenerationRecord> gallery = [];
  ImageGenerationRecord? activeImage;

  @override
  void onInit() {
    super.onInit();
    loadImageModels();
    loadImageGallery();
  }

  Future<void> loadImageModels() async {
    final response = await _repo.fetchImageModels();
    if (response.statusCode == 200 && response.body != null && response.body['models'] != null) {
      final list = response.body['models'] as List;
      models = list.map((e) => ImageModelDefinition.fromJson(e)).toList();
      if (models.isNotEmpty) {
        selectedModel = models.firstWhere((m) => m.isDefault, orElse: () => models.first);
        if (!selectedModel.aspectRatios.contains(selectedAspectRatio)) {
          selectedAspectRatio = selectedModel.defaultAspectRatio;
        }
      }
      update();
    }
  }

  void selectModel(ImageModelDefinition model) {
    selectedModel = model;
    if (!model.aspectRatios.contains(selectedAspectRatio)) {
      selectedAspectRatio = model.defaultAspectRatio;
    }
    update();
  }

  void setAspectRatio(String ratio) {
    selectedAspectRatio = ratio;
    update();
  }

  void setActiveImage(ImageGenerationRecord image) {
    activeImage = image;
    update();
  }

  Future<void> loadImageGallery() async {
    isLoadingGallery = true;
    update();

    final response = await _repo.fetchImageGallery(limit: 30);
    if (response.statusCode == 200 && response.body != null && response.body['items'] != null) {
      final list = response.body['items'] as List;
      gallery = list.map((e) => ImageGenerationRecord.fromJson(e)).toList();
      if (gallery.isNotEmpty && activeImage == null) {
        activeImage = gallery.first;
      }
    }

    isLoadingGallery = false;
    update();
  }

  Future<bool> generateImage(String prompt) async {
    if (prompt.trim().isEmpty) {
      showCustomSnackBar('Please enter a prompt to generate an image.');
      return false;
    }

    isGenerating = true;
    update();

    final response = await _repo.generateImage(
      prompt: prompt,
      aiModelId: selectedModel.dbId,
      aspectRatio: selectedAspectRatio,
    );

    isGenerating = false;

    if (response.statusCode == 200 && response.body != null && response.body['project'] != null) {
      final proj = response.body['project'];
      final newRecord = ImageGenerationRecord(
        id: proj['id']?.toString() ?? '',
        name: proj['name']?.toString() ?? '',
        imageUrl: proj['imageUrl']?.toString() ?? '',
        prompt: prompt.trim(),
        modelLabel: selectedModel.name,
        createdAt: proj['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
      );

      activeImage = newRecord;
      gallery.insert(0, newRecord);

      // Refresh credits in profile
      try {
        Get.find<ProfileController>().fetchProfile();
      } catch (_) {}

      showCustomSnackBar('Image generated successfully!', isError: false);
      update();
      return true;
    } else {
      final errorMsg = response.body != null && response.body['error'] != null
          ? response.body['error'].toString()
          : 'Failed to generate image. Please try again.';
      showCustomSnackBar(errorMsg);
      update();
      return false;
    }
  }
}
