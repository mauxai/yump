import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ProfileAccountSection extends GetView<ProfileController> {
  const ProfileAccountSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'account'.tr,
          style: robotoMedium.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            fontSize: Dimensions.fontSizeSmall,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Theme.of(context).colorScheme.outline),
          ),
          child: Column(
            children: [
              _ProfileAccountTile(
                icon: Icons.person_outline,
                title: 'edit_profile'.tr,
                onTap: () => Get.toNamed(RouteHelper.getEditProfileRoute()),
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.brightness_6_rounded,
                title: 'appearance'.tr,
                onTap: () => controller.showThemeDialog(context),
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.language_rounded,
                title: 'language'.tr,
                onTap: () => controller.showLanguageDialog(context),
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.logout,
                title: 'sign_out'.tr,
                onTap: () => controller.showSignOutDialog(context),
                isDestructive: true,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ProfileAccountTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final bool isDestructive;

  const _ProfileAccountTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(
              icon,
              color: isDestructive
                  ? AppColors.gradientStart
                  : Theme.of(context).colorScheme.onSurfaceVariant,
              size: 20,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: robotoRegular.copyWith(
                  color: isDestructive
                      ? AppColors.gradientStart
                      : Theme.of(context).colorScheme.onSurface,
                  fontSize: 15,
                ),
              ),
            ),
            if (!isDestructive)
              Icon(
                Icons.chevron_right,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
