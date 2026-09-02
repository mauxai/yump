import 'package:flutter/material.dart';
import 'package:get/get.dart';
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
        notchMargin: 8,
        shape: const CircularNotchedRectangle(),
        elevation: 0,
        child: SizedBox(
          height: 60,
          child: GetBuilder<DashboardController>(builder: (controller) {
            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                DashboardNavItem(
                  isSelected: controller.currentIndex == 0,
                  icon: Icons.home_rounded,
                  label: 'home'.tr,
                  onTap: () => controller.changeTab(0),
                ),
                DashboardNavItem(
                  isSelected: controller.currentIndex == 1,
                  icon: Icons.forum_outlined,
                  label: 'chat'.tr,
                  onTap: () => controller.changeTab(1),
                ),
                const SizedBox(width: 56),
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
