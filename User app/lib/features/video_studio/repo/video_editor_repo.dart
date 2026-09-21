import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class VideoEditorRepo {
  final AuthRepo authRepo;
  final ApiClient apiClient;

  VideoEditorRepo({required this.authRepo, required this.apiClient});

  Future<Response> renderVideoEdit({
    required String title,
    required List<Map<String, dynamic>> clips,
    String? soundtrackUrl,
    double soundtrackVolume = 0.5,
    List<Map<String, dynamic>> textOverlays = const [],
    String aspectRatio = '16:9',
    String resolution = 'hd',
  }) async {
    final body = {
      'title': title,
      'clips': clips,
      if (soundtrackUrl != null && soundtrackUrl.trim().isNotEmpty) 'soundtrackUrl': soundtrackUrl.trim(),
      'soundtrackVolume': soundtrackVolume,
      'textOverlays': textOverlays,
      'aspectRatio': aspectRatio,
      'resolution': resolution,
      'format': 'mp4',
    };
    return await apiClient.postData(AppConstants.videoEditRenderUri, body);
  }

  Future<Response> checkVideoEditStatus(String id) async {
    return await apiClient.getData('${AppConstants.videoEditStatusUri}$id/status');
  }

  Future<Response> fetchVideoEditGallery({int page = 1, int limit = 20}) async {
    return await apiClient.getData('${AppConstants.videoEditGalleryUri}?page=$page&limit=$limit');
  }

  Future<Response> deleteVideoEdit(String id) async {
    return await apiClient.deleteData('${AppConstants.videoEditDeleteUri}$id');
  }

  Future<Response> uploadMedia({required String filePath, required String mediaType}) async {
    return await apiClient.postMultipartData(
      AppConstants.videoEditUploadUri,
      {'type': mediaType},
      [MultipartBody('file', XFile(filePath))],
      [],
    );
  }
}
