import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/util/app_constants.dart';

class ConfigRepo {
  final ApiClient _apiClient;

  ConfigRepo({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<Response> getConfig() => _apiClient.getData(AppConstants.configUri);
}
