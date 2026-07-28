import 'dart:io';
import 'dart:typed_data';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/features/projects/model/project_model.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:path_provider/path_provider.dart';

class ProjectsRepo {
  final AuthRepo authRepo;
  final ApiClient _apiClient;
  final List<ProjectModel> projects = [];

  ProjectsRepo({required this.authRepo, required ApiClient apiClient}) : _apiClient = apiClient;

  Future<Response> getProjects({required int page, required int pageSize}) {
    return _apiClient.getData('${AppConstants.projectListUri}?page=$page&pageSize=$pageSize');
  }

  Future<Response> getProjectDetails(String id) {
    return _apiClient.getData('${AppConstants.projectDetailsUri}$id');
  }

  Future<Response> deleteProject(String id) {
    return _apiClient.deleteData('${AppConstants.deleteProjectUri}/$id');
  }

  Future<Response> createProjectFromPath(String name, String imagePath) {
    return _apiClient.postMultipartData(
      handleError: false,
      AppConstants.createProjectUri,
      {'name': name},
      [MultipartBody('image', XFile(imagePath))],
      [],
    );
  }

  Future<Response> createProject(String name, Uint8List imageBytes) async {
    final tempFile = await _writeTempFile(imageBytes);
    try {
      return await _apiClient.postMultipartData(
        AppConstants.projectListUri,
        {'name': name},
        [MultipartBody('image', XFile(tempFile.path))],
        [],
      );
    } finally {
      await _deleteTempFile(tempFile);
    }
  }

  Future<Response> applyEdit(String projectId, String prompt, String? parentId, Uint8List imageBytes, String aiModelId, {String? templateId}) async {
    final url = '${AppConstants.applyEditUrl}$projectId/edit';
    final hasTemplate = templateId != null && templateId.isNotEmpty;
    if (hasTemplate) {
      return _apiClient.postData(url, {'aiModelId': aiModelId, 'templateId': templateId});
    }

    final tempFile = await _writeTempFile(imageBytes);
    final body = <String, String>{'prompt': prompt, 'aiModelId': aiModelId};
    if (parentId != null) body['parentId'] = parentId;
    try {
      return await _apiClient.postMultipartData(
        url,
        body,
        [MultipartBody('drawing', XFile(tempFile.path))],
        [],
      );
    } finally {
      await _deleteTempFile(tempFile);
    }
  }

  Future<File> _writeTempFile(Uint8List bytes) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/${AppConstants.appName}_${DateTime.now().millisecondsSinceEpoch}.png');
    await file.writeAsBytes(bytes);
    return file;
  }

  Future<void> _deleteTempFile(File file) async {
    if (await file.exists()) await file.delete();
  }
}
