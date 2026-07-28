import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/common/widgets/delete_confirm_dialog_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/notification/controllers/notification_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class NotificationHeader extends StatelessWidget {
  const NotificationHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Dimensions.paddingSizeLarge,
        16,
        Dimensions.paddingSizeLarge,
        Dimensions.paddingSizeEight,
      ),
      child: Row(children: [
        GestureDetector(
          onTap: Get.back,
          child: Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 3),
            ),
            child: Icon(
              Icons.arrow_back_ios_new_rounded,
              color: theme.colorScheme.onSurface,
              size: 16,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: GetBuilder<NotificationController>(builder: (controller) {
            return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                'notification_title'.tr,
                style: robotoBold.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontSize: Dimensions.paddingSizeLarge,
                ),
              ),
              if (controller.unreadCount > 0) ...[
                const SizedBox(height: 2),
                Text(
                  'unread_count_label'.trParams({'count': '${controller.unreadCount}'}),
                  style: robotoMedium.copyWith(
                    color: AppColors.gradientEnd,
                    fontSize: Dimensions.fontSizeSmall,
                  ),
                ),
              ],
            ]);
          }),
        ),
        GetBuilder<NotificationController>(builder: (controller) {
          if (controller.unreadCount == 0) return const SizedBox.shrink();
          return GestureDetector(
            onTap: controller.isMarkingAllRead ? null : () => _confirmMarkAllRead(context, controller),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: Dimensions.fontSizeSmall,
                vertical: Dimensions.paddingSizeEight,
              ),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                border: Border.all(color: theme.colorScheme.outline),
              ),
              child: controller.isMarkingAllRead
                  ? const SizedBox(
                      width: 14, height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(
                        Icons.done_all_rounded,
                        size: Dimensions.fontSizeDefault,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'mark_all_read'.tr,
                        style: robotoMedium.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          fontSize: Dimensions.fontSizeSmall,
                        ),
                      ),
                    ]),
            ),
          );
        }),
      ]),
    );
  }

  void _confirmMarkAllRead(BuildContext context, NotificationController controller) {
    DeleteConfirmDialog.show(
      context,
      title: 'mark_all_read_title'.tr,
      message: 'mark_all_read_message'.tr,
      confirmLabel: 'mark_all_read'.tr,
      onConfirm: () async {
        final ok = await controller.markAllAsRead();
        if (ok) {
          showCustomSnackBar('notifications_marked_read'.tr, isError: false);
        } else {
          showCustomSnackBar('mark_all_read_failed'.tr);
        }
      },
    );
  }
}
