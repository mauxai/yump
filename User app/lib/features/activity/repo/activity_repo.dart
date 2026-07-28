import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class ActivityRepo {
  final AuthRepo authRepo;
  final ApiClient _apiClient;

  ActivityRepo({required this.authRepo, required ApiClient apiClient}) : _apiClient = apiClient;

  Future<Response> getActivity({required int page, required int pageSize, String query = ''}) {
    final q = query.isNotEmpty ? '&q=${Uri.encodeQueryComponent(query)}' : '';
    return _apiClient.getData('${AppConstants.activityUri}?page=$page&pageSize=$pageSize$q');
  }
}
