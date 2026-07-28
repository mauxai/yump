import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/common/widgets/delete_confirm_dialog_widget.dart';
import 'package:lumen/features/notification/controllers/notification_controller.dart';
import 'package:lumen/features/notification/model/notification_response_model.dart';
import 'package:lumen/features/notification/widgets/notification_card.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class NotificationList extends GetView<NotificationController> {
  const NotificationList({super.key});

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification.metrics.pixels >= notification.metrics.maxScrollExtent - 200) {
          controller.loadMore();
        }
        return false;
      },
      child: RefreshIndicator(
        onRefresh: () => controller.loadNotifications(showLoader: false),
        child: ListView.builder(
          padding: const EdgeInsets.fromLTRB(
            Dimensions.paddingSizeLarge,
            Dimensions.paddingSizeEight,
            Dimensions.paddingSizeLarge,
            Dimensions.paddingSizeExtraLarge,
          ),
          itemCount: controller.notifications.length + (controller.isLoadingMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index >= controller.notifications.length) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: Dimensions.paddingSizeLarge),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2.4)),
              );
            }
            final item = controller.notifications[index];
            return _SwipeToDelete(
              item: item,
              child: NotificationCard(item: item),
            );
          },
        ),
      ),
    );
  }
}

class _SwipeToDelete extends StatelessWidget {
  final Notifications item;
  final Widget child;

  const _SwipeToDelete({required this.item, required this.child});

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey('notification_${item.id ?? identityHashCode(item)}'),
      direction: DismissDirection.endToStart,
      background: Container(
        margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
        padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
        alignment: Alignment.centerRight,
        decoration: BoxDecoration(
          color: Colors.red.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge + 1),
          border: Border.all(color: Colors.red.withValues(alpha: 0.30)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.delete_outline_rounded, color: Colors.red.shade400, size: 22),
          const SizedBox(width: 6),
          Text(
            'delete'.tr,
            style: robotoMedium.copyWith(
              color: Colors.red.shade400,
              fontSize: Dimensions.fontSizeDefault,
            ),
          ),
        ]),
      ),
      confirmDismiss: (_) async {
        final confirmed = await showDialog<bool>(
          context: context,
          builder: (_) => DeleteConfirmDialog(
            title: 'delete_notification_title'.tr,
            message: 'delete_notification_message'.tr,
            onConfirm: () => Get.back(result: true),
          ),
        );
        return confirmed == true;
      },
      onDismissed: (_) async {
        final controller = Get.find<NotificationController>();
        final ok = await controller.deleteNotification(item);
        if (ok) {
          showCustomSnackBar('notification_deleted'.tr, isError: false);
        } else {
          showCustomSnackBar('delete_notification_failed'.tr);
        }
      },
      child: child,
    );
  }
}
