import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class HomeRepo {
  final AuthRepo authRepo;
  final ApiClient _apiClient;

  HomeRepo({required this.authRepo, required ApiClient apiClient}) : _apiClient = apiClient;

  Future<Response> getSuggestions() {
    return _apiClient.getData(AppConstants.promtSuggestionsUrl);
  }
}
