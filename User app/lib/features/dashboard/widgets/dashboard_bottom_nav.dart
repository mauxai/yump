import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/features/dashboard/widgets/dashboard_nav_item.dart';
import 'package:lumen/util/dimensions.dart';

class DashboardBottomNav extends GetView<DashboardController> {
  const DashboardBottomNav({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        Dimensions.bottomDockMargin,
        0,
        Dimensions.bottomDockMargin,
        MediaQuery.of(context).padding.bottom > 0
            ? MediaQuery.of(context).padding.bottom + 4
            : 16,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(32),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            height: Dimensions.bottomDockHeight,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xCC13141C)
                  : Colors.white.withValues(alpha: 0.9),
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.12)
                    : Colors.black.withValues(alpha: 0.08),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.45 : 0.1),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
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
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      controller.onFabTap();
                    },
                    child: Container(
                      width: 46,
                      height: 46,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [AppColors.gradientStart, AppColors.gradientEnd],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x609B5CF6),
                            blurRadius: 12,
                            spreadRadius: 1,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.add_rounded,
                        color: Colors.white,
                        size: 26,
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
      ),
    );
  }
}
