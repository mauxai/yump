import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/home/controllers/home_controller.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class DashboardCreateSheet extends StatelessWidget {
  const DashboardCreateSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text('create_new'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _CreateOptionCard(
                    icon: Icons.image_rounded,
                    title: 'edit_image'.tr,
                    subtitle: 'from_camera_gallery'.tr,
                    color: AppColors.gradientStart,
                    onTap: () {
                      Navigator.pop(context);
                      _showImageSourcePicker(context);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _CreateOptionCard(
                    icon: Icons.videocam_rounded,
                    title: 'create_video'.tr,
                    subtitle: 'text_or_image_video'.tr,
                    color: AppColors.gradientEnd,
                    onTap: () {
                      Navigator.pop(context);
                      Get.toNamed(RouteHelper.getVideoStudioRoute());
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showImageSourcePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined, color: AppColors.gradientStart),
                title: Text('camera'.tr, style: robotoMedium),
                onTap: () {
                  Navigator.pop(context);
                  Get.find<HomeController>().pickFromCamera();
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: AppColors.gradientStart),
                title: Text('gallery'.tr, style: robotoMedium),
                onTap: () {
                  Navigator.pop(context);
                  Get.find<HomeController>().pickFromGallery();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CreateOptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _CreateOptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          border: Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 12),
            Text(title, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault), textAlign: TextAlign.center),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeExtraSmall, color: Theme.of(context).colorScheme.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
