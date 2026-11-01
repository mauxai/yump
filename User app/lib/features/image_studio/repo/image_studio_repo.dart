import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class ImageStudioRepo {
  final AuthRepo authRepo;
  final ApiClient apiClient;

  ImageStudioRepo({required this.authRepo, required this.apiClient});

  Future<Response> fetchImageModels() async {
    return await apiClient.getData(AppConstants.imageModelsUri);
  }

  Future<Response> generateImage({
    required String prompt,
    required String aiModelId,
    required String aspectRatio,
  }) async {
    final body = {
      'prompt': prompt.trim(),
      if (aiModelId.isNotEmpty) 'aiModelId': aiModelId,
      'aspectRatio': aspectRatio,
    };
    return await apiClient.postData(AppConstants.imageGenerateUri, body);
  }

  Future<Response> fetchImageGallery({int limit = 30}) async {
    return await apiClient.getData('${AppConstants.imageGalleryUri}?limit=$limit');
  }
}
