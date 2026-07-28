import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class NotificationRepo {
  final AuthRepo authRepo;
  final ApiClient _apiClient;

  NotificationRepo({required this.authRepo, required ApiClient apiClient}) : _apiClient = apiClient;

  Future<Response> getNotifications({required int page, required int limit}) {
    return _apiClient.getData(
      '${AppConstants.notificationsUri}?page=$page&limit=$limit',
      handleError: false,
    );
  }

  Future<Response> markAsRead(String id) {
    return _apiClient.postData(
      AppConstants.notificationReadUri,
      {'id': id},
      handleError: false,
    );
  }

  Future<Response> markAllAsRead() {
    return _apiClient.postData(
      AppConstants.notificationReadUri,
      const <String, dynamic>{},
      handleError: false,
    );
  }

  Future<Response> deleteById(String id) {
    return _apiClient.deleteData('${AppConstants.notificationsUri}/$id', handleError: false);
  }
}
