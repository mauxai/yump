import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_appbar_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/upgrade/controllers/upgrade_controller.dart';
import 'package:lumen/features/upgrade/widgets/upgrade_plans_tab.dart';
import 'package:lumen/features/upgrade/widgets/upgrade_transactions_tab.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class UpgradeView extends GetView<UpgradeController> {
  const UpgradeView({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: CustomAppBar(
          title: 'upgrade'.tr,
          bottom: TabBar(
            labelStyle: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault),
            unselectedLabelStyle: robotoRegular.copyWith(fontSize: Dimensions.fontSizeDefault),
            labelColor: AppColors.gradientStart,
            unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
            indicatorColor: AppColors.gradientStart,
            indicatorWeight: 2,
            dividerHeight: 0,
            tabs: [
              Tab(text: 'available_plans'.tr),
              Tab(text: 'transactions'.tr),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            UpgradePlansTab(),
            UpgradeTransactionsTab(),
          ],
        ),
      ),
    );
  }
}
