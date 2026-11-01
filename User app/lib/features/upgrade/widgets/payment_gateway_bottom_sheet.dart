import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/upgrade/controllers/upgrade_controller.dart';
import 'package:lumen/helper/price_converter.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class PaymentGatewayBottomSheet {
  static void show(BuildContext context, Plan plan) {
    final controller = Get.find<UpgradeController>();
    if (controller.gateways.isEmpty && !controller.isLoadingGateways) {
      controller.fetchGateways();
    }
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _SheetContent(plan: plan),
    );
  }
}

class _SheetContent extends StatelessWidget {
  final Plan plan;
  const _SheetContent({required this.plan});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
        Dimensions.paddingSizeExtraLarge,
        Dimensions.fontSizeSmall,
        Dimensions.paddingSizeExtraLarge,
        Dimensions.paddingSizeExtraLarge + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.outline,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          const SizedBox(height: 20),

          _PlanOverviewCard(plan: plan),

          const SizedBox(height: 24),

          GetBuilder<UpgradeController>(builder: (c) {
            final gateway = c.selectedGateway ?? (c.gateways.isNotEmpty ? c.gateways.first : null);
            final bool isLoading = c.isPurchasing || c.isLoadingGateways;

            return CustomGradientButton(
              text: 'purchase_plan_btn'.tr,
              isLoading: isLoading,
              onTap: () {
                if (c.isLoadingGateways) return;
                if (gateway == null || gateway.id == null) {
                  if (c.gateways.isEmpty) {
                    c.fetchGateways();
                  }
                  showCustomSnackBar('select_gateway'.tr);
                  return;
                }
                c.selectGateway(gateway);
                c.purchasePlan(plan: plan, gatewayId: gateway.id!);
              },
            );
          }),
        ],
      ),
    );
  }
}

class _PlanOverviewCard extends StatelessWidget {
  final Plan plan;
  const _PlanOverviewCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.gradientStart.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gradientStart.withValues(alpha: 0.2)),
      ),
      child: Row(children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                plan.name ?? '',
                style: robotoMedium.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: Dimensions.fontSizeSmall,
                ),
              ),
              const SizedBox(height: 4),
              Text(PriceConverter.convertPrice(plan.price),
                style: robotoBold.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontSize: 26,
                ),
              ),
            ],
          ),
        ),

        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: AppColors.gradientStart.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.bolt, color: AppColors.gradientStart, size: 16),
            const SizedBox(width: 4),
            Text(
              'plan_credits'.trParams({'credits': '${plan.credits ?? 0}'}),
              style: robotoMedium.copyWith(
                color: AppColors.gradientStart,
                fontSize: Dimensions.fontSizeSmall,
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}
