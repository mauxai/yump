import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class UpgradeRepo {
  final AuthRepo authRepo;
  final ApiClient _apiClient;

  UpgradeRepo({required this.authRepo, required ApiClient apiClient}) : _apiClient = apiClient;

  Future<Response> getPlans() {
    return _apiClient.getData(AppConstants.planListUri);
  }

  Future<Response> getGateways() {
    return _apiClient.getData(AppConstants.gatewayListUri);
  }

  String? get userToken => authRepo.getString(AppConstants.token);

  Future<Response> getBillingHistory({
    required int page, required int pageSize,
    String status = '', String search = '',
  }) {
    var uri = '${AppConstants.billingHistoryUri}?page=$page&pageSize=$pageSize';
    if (status.isNotEmpty) uri += '&status=$status';
    if (search.isNotEmpty) uri += '&q=${Uri.encodeComponent(search)}';
    return _apiClient.getData(uri);
  }

  Future<Response> checkout({required String planId, required String gatewayId}) {
    return _apiClient.postData(AppConstants.purchasePlanUri,
      {
        'planId': planId,
        'gatewayId': gatewayId,
        "returnMode" : "api"
      },
    );
  }
}
