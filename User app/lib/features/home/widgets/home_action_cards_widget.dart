import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class HomeActionCards extends StatelessWidget {
  final VoidCallback onCameraTap;
  final VoidCallback onGalleryTap;

  const HomeActionCards({
    super.key,
    required this.onCameraTap,
    required this.onGalleryTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _HomeActionCard(
            icon: Icon(
              Icons.camera_alt_outlined,
              color: Theme.of(context).colorScheme.onSurface,
              size: Dimensions.fontSizeOverLarge + Dimensions.radiusSmall - 1,
            ),
            title: 'camera'.tr,
            subtitle: 'take_photo'.tr,
            onTap: onCameraTap,
          ),
        ),
        const SizedBox(width: Dimensions.fontSizeSmall),
        Expanded(
          child: _HomeActionCard(
            icon: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: AppColors.mainGradient,
                borderRadius: BorderRadius.circular(Dimensions.fontSizeSmall),
              ),
              child: const Icon(
                Icons.upload_rounded,
                color: Colors.white,
                size: 22,
              ),
            ),
            title: 'upload'.tr,
            subtitle: 'from_gallery'.tr,
            onTap: onGalleryTap,
          ),
        ),
      ],
    );
  }
}

class _HomeActionCard extends StatelessWidget {
  final Widget icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _HomeActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge + 1),
          border: Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            icon,
            const SizedBox(height: Dimensions.paddingSizeEight),
            Text(
              title,
              style: robotoBold.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: Dimensions.paddingSizeDefault,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: robotoRegular.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: Dimensions.fontSizeSmall,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
