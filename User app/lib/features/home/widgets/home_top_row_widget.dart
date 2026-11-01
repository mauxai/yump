import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        ProfileBottomSheet.show(context);
      },
      child: Row(children: [
        UserAvatar(
          name: userName,
          photoUrl: userPhoto,
          size: 44,
          borderRadius: 14,
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
                        fontSize: Dimensions.fontSizeSmall,
                      ),
                    ),
                    TextSpan(
                      text: userName,
                      style: robotoMedium.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontSize: Dimensions.fontSizeSmall + 1,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 2),
              Row(mainAxisSize: MainAxisSize.min, children: [
                Text(
                  AppConstants.appName,
                  style: robotoBold.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: 17,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF28233C) : const Color(0xFFF3E8FF),
                    borderRadius: BorderRadius.circular(Dimensions.radiusPill),
                    border: Border.all(
                      color: isDark ? const Color(0xFF483D6D) : const Color(0xFFDDD6FE),
                      width: 0.8,
                    ),
                  ),
                  child: Text(
                    planName ?? 'no_plan'.tr,
                    style: robotoMedium.copyWith(
                      color: isDark ? const Color(0xFFD8B4FE) : const Color(0xFF7E22CE),
                      fontSize: 10,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
              ]),
            ],
          ),
        ),
        GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            Get.toNamed(RouteHelper.getNotificationRoute());
          },
          child: GetBuilder<NotificationController>(builder: (notificationController) {
            final unread = notificationController.unreadCount;
            return Stack(clipBehavior: Clip.none, children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF141620) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? const Color(0xFF26283B) : const Color(0xFFE5E7EB),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.notifications_outlined,
                  color: Theme.of(context).colorScheme.onSurface,
                  size: 21,
                ),
              ),
              if (unread > 0)
                Positioned(
                  top: -3,
                  right: -3,
                  child: Container(
                    constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: AppColors.mainGradient,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(
                        color: Theme.of(context).scaffoldBackgroundColor,
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.gradientStart.withValues(alpha: 0.5),
                          blurRadius: 4,
                          spreadRadius: 0.5,
                        ),
                      ],
                    ),
                    child: Text(
                      unread > 99 ? '99+' : '$unread',
                      style: robotoBold.copyWith(
                        color: Colors.white,
                        fontSize: 9.5,
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
