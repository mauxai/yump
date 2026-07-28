import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_image.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/notification/model/notification_response_model.dart';
import 'package:lumen/helper/date_converter.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class NotificationDetailSheet extends StatelessWidget {
  final Notifications item;
  final String? resolvedImageUrl;

  const NotificationDetailSheet({super.key, required this.item, this.resolvedImageUrl});

  static Future<void> show(BuildContext context, {required Notifications item, String? resolvedImageUrl}) {
    return Get.bottomSheet(
      NotificationDetailSheet(item: item, resolvedImageUrl: resolvedImageUrl),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enableDrag: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final title = item.title ?? '';
    final body = item.body ?? '';
    final timeAgo = DateConverter.timeAgoFromString(item.createdAt);
    final fullDate = DateConverter.formatDateString(item.createdAt, pattern: 'MMM d, yyyy · h:mm a');
    final projectName = item.data?.projectName;
    final notificationType = item.data?.notificationType;

    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      minChildSize: 0.3,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(Dimensions.radiusExtraLarge)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const SizedBox(height: Dimensions.paddingSizeSmall),
          Center(
            child: Container(
              width: 44, height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.outline,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.fromLTRB(
                Dimensions.paddingSizeLarge,
                Dimensions.paddingSizeLarge,
                Dimensions.paddingSizeLarge,
                Dimensions.paddingSizeExtraLarge,
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (resolvedImageUrl != null && resolvedImageUrl!.isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
                    child: AspectRatio(
                      aspectRatio: 16 / 9,
                      child: CustomImage(image: resolvedImageUrl, fit: BoxFit.cover),
                    ),
                  ),
                if (resolvedImageUrl != null && resolvedImageUrl!.isNotEmpty)
                  const SizedBox(height: Dimensions.paddingSizeLarge),

                if (notificationType != null && notificationType.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [
                        AppColors.gradientStart.withValues(alpha: 0.18),
                        AppColors.gradientEnd.withValues(alpha: 0.18),
                      ]),
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall + 1),
                    ),
                    child: Text(
                      _humanizeType(notificationType),
                      style: robotoMedium.copyWith(
                        color: AppColors.gradientEnd,
                        fontSize: Dimensions.fontSizeExtraSmall + 1,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
                if (notificationType != null && notificationType.isNotEmpty)
                  const SizedBox(height: Dimensions.paddingSizeSmall),

                if (title.isNotEmpty)
                  Text(
                    title,
                    style: robotoBold.copyWith(
                      color: theme.colorScheme.onSurface,
                      fontSize: Dimensions.fontSizeExtraLarge,
                      height: 1.3,
                    ),
                  ),
                if (title.isNotEmpty) const SizedBox(height: Dimensions.paddingSizeEight),

                if (body.isNotEmpty)
                  Text(
                    body,
                    style: robotoRegular.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.85),
                      fontSize: Dimensions.fontSizeDefault,
                      height: 1.55,
                    ),
                  ),
                if (body.isNotEmpty) const SizedBox(height: Dimensions.paddingSizeLarge),

                _DetailRow(
                  icon: Icons.access_time_rounded,
                  label: timeAgo.isNotEmpty ? timeAgo : '—',
                  trailing: fullDate.isNotEmpty ? fullDate : null,
                ),
                if (projectName != null && projectName.isNotEmpty) ...[
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  _DetailRow(
                    icon: Icons.folder_outlined,
                    label: projectName,
                  ),
                ],
              ]),
            ),
          ),
        ]),
      ),
    );
  }

  static String _humanizeType(String raw) {
    return raw
        .split('_')
        .where((s) => s.isNotEmpty)
        .map((s) => s[0].toUpperCase() + s.substring(1))
        .join(' ');
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? trailing;

  const _DetailRow({required this.icon, required this.label, this.trailing});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(children: [
      Icon(icon, size: 16, color: theme.colorScheme.onSurfaceVariant),
      const SizedBox(width: Dimensions.paddingSizeEight),
      Expanded(
        child: Text(
          label,
          style: robotoMedium.copyWith(
            color: theme.colorScheme.onSurface,
            fontSize: Dimensions.fontSizeSmall + 1,
          ),
        ),
      ),
      if (trailing != null && trailing!.isNotEmpty)
        Text(
          trailing!,
          style: robotoRegular.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            fontSize: Dimensions.fontSizeSmall,
          ),
        ),
    ]);
  }
}
