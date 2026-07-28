import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../core/theme/app_colors.dart';
import '../../features/profile/controllers/profile_controller.dart';
import '../../util/dimensions.dart';
import '../../util/styles.dart';

class ProfileBottomSheet {
  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => const _ProfileSheetContent(),
    );
  }
}

class _ProfileSheetContent extends StatelessWidget {
  const _ProfileSheetContent();

  String _initials(String name) {
    final parts = name.trim().split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty) return parts[0][0].toUpperCase();
    return 'U';
  }

  @override
  Widget build(BuildContext context) {
    final profileController = Get.find<ProfileController>();
    final name = profileController.user?.name ?? 'guest_user'.tr;
    final email = profileController.user?.email ?? '';
    final plan = profileController.user?.currentPlan?.name ?? '';
    final photo = profileController.user?.avatar ?? '';

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(Dimensions.fontSizeOverLarge),
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        Dimensions.fontSizeOverLarge,
        Dimensions.fontSizeSmall,
        Dimensions.fontSizeOverLarge,
        Dimensions.fontSizeOverLarge + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.outline,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 28),
          _buildAvatar(context, photo, name),
          const SizedBox(height: 16),
          Text(
            name.isEmpty ? 'guest_user'.tr : name,
            style: robotoBold.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: Dimensions.paddingSizeLarge,
            ),
          ),
          const SizedBox(height: 20),
          _buildInfoRow(context, Icons.email_outlined,
              email.isEmpty ? 'not_provided'.tr : email),
          const SizedBox(height: 10),
          _buildInfoRow(context, Icons.workspace_premium_outlined,
              plan.isEmpty ? 'not_provided'.tr : plan),
          const SizedBox(height: 32),
          GestureDetector(
            onTap: () {
              Get.back();
              profileController.showSignOutDialog(context);
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFFF3B30).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(Dimensions.fontSizeSmall),
                border: Border.all(
                  color: const Color(0xFFFF3B30).withValues(alpha: 0.5),
                ),
              ),
              child: Text(
                'sign_out'.tr,
                textAlign: TextAlign.center,
                style: robotoMedium.copyWith(
                  color: const Color(0xFFFF3B30),
                  fontSize: Dimensions.paddingSizeDefault,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(BuildContext context, String photo, String name) {
    if (photo.isNotEmpty) {
      return CircleAvatar(
        radius: 44,
        backgroundImage: CachedNetworkImageProvider(photo),
        backgroundColor: Theme.of(context).colorScheme.surface,
      );
    }
    return Container(
      width: 88,
      height: 88,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.gradientStart, AppColors.gradientEnd],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          _initials(name),
          style: robotoBold.copyWith(
            color: Colors.white,
            fontSize: 32,
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(BuildContext context, IconData icon, String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            size: Dimensions.fontSizeExtraLarge,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: robotoRegular.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: Dimensions.fontSizeDefault,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
