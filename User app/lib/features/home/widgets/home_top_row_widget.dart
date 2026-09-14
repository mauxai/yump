import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/profile_bottom_sheet.dart';
import 'package:lumen/common/widgets/user_avatar.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/notification/controllers/notification_controller.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class HomeTopRow extends StatelessWidget {
  final String userName;
  final String userPhoto;
  final String? planName;

  const HomeTopRow({
    super.key,
    required this.userName,
    required this.userPhoto,
    this.planName,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => ProfileBottomSheet.show(context),
      child: Row(children: [
        UserAvatar(
          name: userName,
          photoUrl: userPhoto,
          size: 44,
          borderRadius: Dimensions.radiusLarge - 3,
        ),
        const SizedBox(width: Dimensions.fontSizeSmall),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: '${'hi'.tr} ',
                      style: robotoRegular.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontSize: Dimensions.fontSizeDefault,
                      ),
                    ),
                    TextSpan(
                      text: userName,
                      style: robotoMedium.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontSize: Dimensions.fontSizeDefault,
                      ),
                    ),
                  ],
                ),
              ),
              Row(mainAxisSize: MainAxisSize.min, children: [
                Text(
                  AppConstants.appName,
                  style: robotoBold.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: Dimensions.fontSizeLarge,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.freeBadge,
                    borderRadius: BorderRadius.circular(Dimensions.radiusSmall - 1),
                  ),
                  child: Text(
                    planName ?? 'no_plan'.tr,
                    style: robotoMedium.copyWith(
                      color: Colors.white,
                      fontSize: Dimensions.fontSizeExtraSmall,
                    ),
                  ),
                ),
              ]),
            ],
          ),
        ),
        GestureDetector(
          onTap: () => Get.toNamed(RouteHelper.getNotificationRoute()),
          child: GetBuilder<NotificationController>(builder: (notificationController) {
            final unread = notificationController.unreadCount;
            return Stack(clipBehavior: Clip.none, children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 3),
                  border: Border.all(color: Theme.of(context).colorScheme.outline),
                ),
                child: Icon(
                  Icons.notifications_outlined,
                  color: Theme.of(context).colorScheme.onSurface,
                  size: 22,
                ),
              ),
              if (unread > 0)
                Positioned(
                  top: -4, right: -4,
                  child: Container(
                    constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.redDot,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(
                        color: Theme.of(context).scaffoldBackgroundColor,
                        width: 1.5,
                      ),
                    ),
                    child: Text(
                      unread > 99 ? '99+' : '$unread',
                      style: robotoBold.copyWith(
                        color: Colors.white,
                        fontSize: 10,
                        height: 1.1,
                      ),
                    ),
                  ),
                ),
            ]);
          }),
        ),
      ]),
    );
  }
}
