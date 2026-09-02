import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/common/widgets/exit_confirm_dialog.dart';
import 'package:lumen/features/chat/views/chat_view.dart';
import 'package:lumen/features/creations/views/creations_view.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/features/dashboard/widgets/dashboard_bottom_nav.dart';
import 'package:lumen/features/dashboard/widgets/dashboard_fab.dart';
import 'package:lumen/features/home/views/home_view.dart';
import 'package:lumen/features/profile/views/profile_view.dart';
import 'package:lumen/features/upgrade/widgets/plan_purchase_success_dialog.dart';
import 'package:lumen/util/dimensions.dart';

class DashboardView extends GetView<DashboardController> {
  final int pageIndex;
  final Plan? purchasedPlan;
  const DashboardView({super.key, this.pageIndex = 0, this.purchasedPlan});

  @override
  Widget build(BuildContext context) {
    if (controller.currentIndex != pageIndex) {
      WidgetsBinding.instance.addPostFrameCallback((_) => controller.changeTab(pageIndex));
    }

    return GetBuilder<DashboardController>(
      initState: (_) {
        WidgetsBinding.instance.addPostFrameCallback((_) => controller.checkForUpdate());
        WidgetsBinding.instance.addPostFrameCallback((_) => controller.fetchDashboardData());
        if (purchasedPlan != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Future.delayed(const Duration(milliseconds: 800), () {
              if (!context.mounted) return;
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (_) => AlertDialog(
                  contentPadding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusLarge)),
                  content: PlanPurchaseSuccessDialog(plan: purchasedPlan!),
                ),
              );
            });
          });
        }
      },
      builder: (controller) {
      return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) async {
          if (didPop) return;
          // From any secondary tab, back returns to Home first.
          if (controller.currentIndex != 0) {
            controller.changeTab(0);
            return;
          }
          // On Home, confirm before leaving the app.
          if (context.mounted) await ExitConfirmDialog.handleBack(context);
        },
        child: Scaffold(
          backgroundColor: Theme.of(context).scaffoldBackgroundColor,
          body: IndexedStack(
            index: controller.currentIndex,
            children: const [
              HomeView(),
              ChatView(),
              SizedBox.shrink(),
              CreationsView(),
              ProfileView(),
            ],
          ),
          floatingActionButton: DashboardFab(onTap: controller.onFabTap),
          floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
          bottomNavigationBar: const DashboardBottomNav(),
        ),
      );
    });
  }
}
