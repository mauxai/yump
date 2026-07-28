import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/upgrade/controllers/upgrade_controller.dart';
import 'package:lumen/features/upgrade/widgets/payment_gateway_bottom_sheet.dart';
import 'package:lumen/features/upgrade/widgets/upgrade_plan_card_item.dart';
import 'package:lumen/features/upgrade/widgets/upgrade_plan_shimmer.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class UpgradePlansTab extends StatelessWidget {
  const UpgradePlansTab({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<UpgradeController>(builder: (c) {
      if (c.isLoading) {
        return const SingleChildScrollView(
          padding: EdgeInsets.all(Dimensions.paddingSizeExtraLarge),
          child: UpgradePlanShimmer(),
        );
      }

      if (c.plans.isEmpty) {
        return Center(
          child: Text(
            'no_plan_available'.tr,
            style: robotoRegular.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: Dimensions.fontSizeDefault,
            ),
          ),
        );
      }

      return ListView.builder(
        padding: const EdgeInsets.all(Dimensions.paddingSizeExtraLarge),
        itemCount: c.plans.length,
        itemBuilder: (_, i) {
          final plan = c.plans[i];
          final state = c.buttonState(plan);
          return UpgradePlanCardItem(
            plan: plan,
            buttonState: state,
            isCurrentPlan: c.isCurrentPlan(plan),
            onTap: () {
              if (state == PlanButtonState.active) return;
              PaymentGatewayBottomSheet.show(context, plan);
            },
          );
        },
      );
    });
  }
}
