import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class AnalyticsRepo {
  final AuthRepo authRepo;
  final ApiClient apiClient;

  AnalyticsRepo({required this.authRepo, required this.apiClient});

  Future<Response> fetchAnalytics() async {
    return await apiClient.getData(AppConstants.analyticsUri);
  }
}
