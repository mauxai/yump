import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class VideoStudioRepo {
  final AuthRepo authRepo;
  final ApiClient apiClient;

  VideoStudioRepo({required this.authRepo, required this.apiClient});

  Future<Response> fetchVideoModels() async {
    return await apiClient.getData(AppConstants.videoModelsUri);
  }

  Future<Response> generateVideo({
    required String prompt,
    String? negativePrompt,
    String? sourceImageUrl,
    required String aspectRatio,
    required String modelKey,
    required int duration,
  }) async {
    final body = {
      'prompt': prompt,
      if (negativePrompt != null && negativePrompt.trim().isNotEmpty) 'negativePrompt': negativePrompt.trim(),
      if (sourceImageUrl != null && sourceImageUrl.trim().isNotEmpty) 'sourceImageUrl': sourceImageUrl.trim(),
      'aspectRatio': aspectRatio,
      'modelKey': modelKey,
      'duration': duration,
    };
    return await apiClient.postData(AppConstants.videoGenerateUri, body);
  }

  Future<Response> checkVideoStatus(String id) async {
    return await apiClient.getData('${AppConstants.videoStatusUri}$id/status');
  }

  Future<Response> fetchVideoGallery({int page = 1, int limit = 20}) async {
    return await apiClient.getData('${AppConstants.videoGalleryUri}?page=$page&limit=$limit');
  }

  Future<Response> deleteVideo(String id) async {
    return await apiClient.deleteData('${AppConstants.videoDeleteUri}$id');
  }
}
