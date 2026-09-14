import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/features/dashboard/widgets/dashboard_nav_item.dart';

class DashboardBottomNav extends GetView<DashboardController> {
  const DashboardBottomNav({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: Theme.of(context).colorScheme.outline,
            width: 1,
          ),
        ),
      ),
      child: BottomAppBar(
        color: Theme.of(context).colorScheme.surface,
        elevation: 0,
        padding: EdgeInsets.zero,
        child: SizedBox(
          height: 60,
          child: GetBuilder<DashboardController>(builder: (controller) {
            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                DashboardNavItem(
                  isSelected: controller.currentIndex == 0,
                  icon: Icons.forum_rounded,
                  label: 'ai_chat'.tr,
                  onTap: () => controller.changeTab(0),
                ),
                DashboardNavItem(
                  isSelected: controller.currentIndex == 1,
                  icon: Icons.auto_fix_high_rounded,
                  label: 'studio'.tr,
                  onTap: () => controller.changeTab(1),
                ),
                GestureDetector(
                  onTap: controller.onFabTap,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.gradientStart, AppColors.gradientEnd],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x409B5CF6),
                          blurRadius: 8,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.add,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                ),
                DashboardNavItem(
                  isSelected: controller.currentIndex == 3,
                  icon: Icons.auto_awesome_mosaic_rounded,
                  label: 'creations'.tr,
                  onTap: () => controller.changeTab(3),
                ),
                DashboardNavItem(
                  isSelected: controller.currentIndex == 4,
                  icon: Icons.person_outline_rounded,
                  label: 'profile'.tr,
                  onTap: () => controller.changeTab(4),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }
}
