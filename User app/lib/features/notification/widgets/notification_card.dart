import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_image.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/notification/controllers/notification_controller.dart';
import 'package:lumen/features/notification/model/notification_response_model.dart';
import 'package:lumen/features/notification/widgets/notification_detail_sheet.dart';
import 'package:lumen/helper/date_converter.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/enums.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class NotificationCard extends StatelessWidget {
  final Notifications item;

  const NotificationCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isRead = item.isRead ?? false;
    final title = item.title ?? '';
    final body = item.body ?? '';
    final timeAgo = DateConverter.timeAgoFromString(item.createdAt);
    final imageUrl = _resolveImage(item.data?.image);

    final radius = BorderRadius.circular(Dimensions.radiusLarge + 1);
    return Padding(
      padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
      child: Material(
        color: isRead ? theme.cardColor : theme.colorScheme.surface,
        borderRadius: radius,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: _onTap,
          borderRadius: radius,
          splashColor: AppColors.gradientEnd.withValues(alpha: 0.18),
          highlightColor: AppColors.gradientEnd.withValues(alpha: 0.08),
          child: Container(
            padding: const EdgeInsets.all(Dimensions.paddingSizeSmall + 2),
            decoration: BoxDecoration(
              borderRadius: radius,
              border: Border.all(
                color: isRead
                    ? theme.colorScheme.outline.withValues(alpha: 0.5)
                    : AppColors.gradientEnd.withValues(alpha: 0.30),
              ),
            ),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _NotificationThumbnail(imageUrl: imageUrl, isRead: isRead),
            const SizedBox(width: Dimensions.paddingSizeSmall + 2),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(
                    child: Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: (isRead ? robotoMedium : robotoBold).copyWith(
                        color: theme.colorScheme.onSurface,
                        fontSize: Dimensions.fontSizeDefault,
                        height: 1.3,
                      ),
                    ),
                  ),
                  if (!isRead) ...[
                    const SizedBox(width: Dimensions.paddingSizeEight),
                    Container(
                      width: 8, height: 8,
                      margin: const EdgeInsets.only(top: 5),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ]),
                if (body.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    body,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: robotoRegular.copyWith(
                      color: isRead
                          ? theme.colorScheme.onSurfaceVariant
                          : theme.colorScheme.onSurface.withValues(alpha: 0.85),
                      fontSize: Dimensions.fontSizeSmall + 1,
                      height: 1.45,
                    ),
                  ),
                ],
                if (timeAgo.isNotEmpty) ...[
                  const SizedBox(height: Dimensions.paddingSizeEight),
                  Row(children: [
                    Icon(
                      Icons.access_time_rounded,
                      size: 12,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      timeAgo,
                      style: robotoRegular.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontSize: Dimensions.fontSizeExtraSmall + 1,
                      ),
                    ),
                  ]),
                ],
              ]),
            ),
          ]),
          ),
        ),
      ),
    );
  }

  Future<void> _onTap() async {
    final controller = Get.find<NotificationController>();
    controller.markAsRead(item);

    final data = item.data;
    final type = NotificationType.fromValue(data?.notificationType);
    final image = _resolveImage(data?.image);

    if (type == NotificationType.editCompleted && image != null && image.isNotEmpty) {
      Get.toNamed(RouteHelper.getEditorRoute(
        imagePath: image,
        projectName: data?.projectName ?? 'Untitled',
        projectId: data?.projectId,
        fromNotification: true,
      ));
      return;
    }

    final ctx = Get.context;
    if (ctx == null) return;
    NotificationDetailSheet.show(ctx, item: item, resolvedImageUrl: image);
  }

  static String? _resolveImage(String? image) {
    if (image == null || image.isEmpty) return null;
    if (image.startsWith('http')) return image;
    return '${AppConstants.baseUrl}$image';
  }
}

class _NotificationThumbnail extends StatelessWidget {
  final String? imageUrl;
  final bool isRead;

  const _NotificationThumbnail({required this.imageUrl, required this.isRead});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderRadius = BorderRadius.circular(Dimensions.radiusDefault + 2);

    final fallback = Container(
      width: 56, height: 56,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.gradientStart.withValues(alpha: 0.18),
            AppColors.gradientEnd.withValues(alpha: 0.18),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: borderRadius,
      ),
      child: Icon(
        Icons.notifications_active_rounded,
        color: theme.colorScheme.onSurface.withValues(alpha: 0.8),
        size: 24,
      ),
    );

    if (imageUrl == null || imageUrl!.isEmpty) return fallback;

    return ClipRRect(
      borderRadius: borderRadius,
      child: SizedBox(
        width: 56, height: 56,
        child: CustomImage(image: imageUrl, height: 56, width: 56, errorWidget: fallback),
      ),
    );
  }
}
