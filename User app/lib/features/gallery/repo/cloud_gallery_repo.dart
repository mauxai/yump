import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class CloudGalleryRepo {
  final AuthRepo authRepo;
  final ApiClient apiClient;

  CloudGalleryRepo({required this.authRepo, required this.apiClient});

  Future<Response> fetchGallery({int page = 1, int limit = 24, String? projectId}) async {
    String uri = '${AppConstants.cloudGalleryUri}?page=$page&limit=$limit';
    if (projectId != null && projectId.isNotEmpty) {
      uri += '&projectId=$projectId';
    }
    return await apiClient.getData(uri);
  }
}
