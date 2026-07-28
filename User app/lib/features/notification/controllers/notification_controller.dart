import 'package:get/get.dart';
import 'package:lumen/features/notification/model/notification_response_model.dart';
import 'package:lumen/features/notification/repo/notification_repo.dart';

class NotificationController extends GetxController implements GetxService {
  final NotificationRepo _notificationRepo;

  NotificationController({required NotificationRepo notificationRepo}) : _notificationRepo = notificationRepo;

  static const int _pageSize = 20;

  final List<Notifications> notifications = [];
  int _currentPage = 1;
  int _totalPages = 1;
  int _unreadCount = 0;

  bool isLoading = false;
  bool isLoadingMore = false;
  bool isRefreshing = false;
  bool hasError = false;
  String? errorMessage;

  bool get hasMore => _currentPage < _totalPages;
  bool get hasLoadedOnce => !isLoading && !hasError;
  int get unreadCount => _unreadCount;

  Future<void> loadNotifications({bool showLoader = true}) async {
    if (showLoader) {
      isLoading = true;
      hasError = false;
      errorMessage = null;
      update();
    } else {
      isRefreshing = true;
    }

    final response = await _notificationRepo.getNotifications(page: 1, limit: _pageSize);

    if (response.statusCode == 200 && response.body != null) {
      final parsed = NotificationResponseModel.fromJson(response.body);
      notifications..clear()..addAll(parsed.notifications ?? []);
      _currentPage = parsed.page ?? 1;
      _totalPages = parsed.totalPages ?? 1;
      _unreadCount = parsed.unreadCount ?? notifications.where((n) => !(n.isRead ?? false)).length;
      hasError = false;
      errorMessage = null;
    } else {
      hasError = notifications.isEmpty;
      errorMessage = response.statusText;
    }

    isLoading = false;
    isRefreshing = false;
    update();
  }

  Future<void> loadMore() async {
    if (isLoadingMore || !hasMore) return;

    isLoadingMore = true;
    update();

    final nextPage = _currentPage + 1;
    final response = await _notificationRepo.getNotifications(page: nextPage, limit: _pageSize);

    if (response.statusCode == 200 && response.body != null) {
      final parsed = NotificationResponseModel.fromJson(response.body);
      final newItems = parsed.notifications ?? [];
      final existingIds = notifications.map((n) => n.id).toSet();
      notifications.addAll(newItems.where((n) => !existingIds.contains(n.id)));
      _currentPage = parsed.page ?? nextPage;
      _totalPages = parsed.totalPages ?? _totalPages;
      if (parsed.unreadCount != null) _unreadCount = parsed.unreadCount!;
    }

    isLoadingMore = false;
    update();
  }

  Future<void> markAsRead(Notifications item) async {
    final id = item.id;
    if (id == null || id.isEmpty) return;
    if (item.isRead == true) return;

    item.isRead = true;
    if (_unreadCount > 0) _unreadCount -= 1;
    update();

    final response = await _notificationRepo.markAsRead(id);
    if (response.statusCode != 200) {
      item.isRead = false;
      _unreadCount += 1;
      update();
    }
  }

  bool isMarkingAllRead = false;

  Future<bool> deleteNotification(Notifications item) async {
    final id = item.id;
    if (id == null || id.isEmpty) return false;

    final index = notifications.indexOf(item);
    if (index == -1) return false;

    final wasUnread = !(item.isRead ?? false);
    notifications.removeAt(index);
    if (wasUnread && _unreadCount > 0) _unreadCount -= 1;
    update();

    final response = await _notificationRepo.deleteById(id);
    final ok = response.statusCode == 200 || response.statusCode == 204;
    if (!ok) {
      notifications.insert(index.clamp(0, notifications.length), item);
      if (wasUnread) _unreadCount += 1;
      update();
    }
    return ok;
  }

  Future<bool> markAllAsRead() async {
    if (isMarkingAllRead) return false;
    final unread = notifications.where((n) => !(n.isRead ?? false)).toList();
    if (unread.isEmpty) return true;

    isMarkingAllRead = true;
    update();

    final response = await _notificationRepo.markAllAsRead();
    final ok = response.statusCode == 200 || response.statusCode == 204;
    if (ok) {
      for (final item in unread) {
        item.isRead = true;
      }
      _unreadCount = 0;
    }
    isMarkingAllRead = false;
    update();
    return ok;
  }
}
