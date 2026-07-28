import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class DashboardRepo {
  final AuthRepo authRepo;
  final ApiClient _apiClient;

  DashboardRepo({required this.authRepo, required ApiClient apiClient}) : _apiClient = apiClient;

  Future<Response> getAiProviders() {
    return _apiClient.getData(AppConstants.aiProvidersUri);
  }

  Future<Response> getEffects() {
    return _apiClient.getData(AppConstants.editorEffectsUri);
  }

  Future<Response> getTemplates({int limit = 100}) {
    return _apiClient.getData('${AppConstants.templatesUri}?limit=$limit');
  }
}
