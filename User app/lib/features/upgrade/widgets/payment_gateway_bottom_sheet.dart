import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/upgrade/controllers/upgrade_controller.dart';
import 'package:lumen/features/upgrade/models/payment_gateways_model.dart';
import 'package:lumen/helper/price_converter.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class PaymentGatewayBottomSheet {
  static void show(BuildContext context, Plan plan) {
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

          Text(
            'select_payment_method'.tr,
            style: robotoBold.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: Dimensions.fontSizeDefault,
            ),
          ),

          const SizedBox(height: 4),

          GetBuilder<UpgradeController>(builder: (c) {
            if (c.isLoadingGateways) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(child: CircularProgressIndicator()),
              );
            }

            if (c.gateways.isEmpty) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Center(
                  child: Text(
                    'no_plan_available'.tr,
                    style: robotoRegular.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              );
            }

            return ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 260),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: c.gateways.length,
                separatorBuilder: (_, __) => Divider(
                  height: 1,
                  color: Theme.of(context).colorScheme.outline,
                ),
                itemBuilder: (_, i) {
                  final gw = c.gateways[i];
                  return _GatewayTile(
                    gateway: gw,
                    isSelected: c.selectedGateway?.id == gw.id,
                    onTap: () => c.selectGateway(gw),
                  );
                },
              ),
            );
          }),

          const SizedBox(height: 20),

          GetBuilder<UpgradeController>(builder: (c) {
            return CustomGradientButton(
              text: 'purchase_plan_btn'.tr,
              isLoading: c.isPurchasing,
              onTap: () {
                if (c.selectedGateway == null) {
                  showCustomSnackBar('select_gateway'.tr);
                  return;
                }
                c.purchasePlan(plan: plan, gatewayId: c.selectedGateway!.id!);
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

class _GatewayTile extends StatelessWidget {
  final Gateways gateway;
  final bool isSelected;
  final VoidCallback onTap;

  const _GatewayTile({
    required this.gateway,
    required this.isSelected,
    required this.onTap,
  });

  String get _logoUrl {
    final logo = gateway.logo ?? '';
    if (logo.isEmpty) return '';
    if (logo.startsWith('http')) return logo;
    return '${AppConstants.baseUrl}$logo';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(children: [
          SizedBox(
            width: 72,
            height: 32,
            child: _logoUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: _logoUrl,
                    fit: BoxFit.contain,
                    alignment: Alignment.centerLeft,
                    errorWidget: (_, __, ___) => Icon(
                      Icons.payment,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      size: 28,
                    ),
                  )
                : Icon(
                    Icons.payment,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    size: 28,
                  ),
          ),

          const SizedBox(width: 12),

          Expanded(
            child: Text(
              gateway.title ?? '',
              style: robotoMedium.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: Dimensions.fontSizeDefault,
              ),
            ),
          ),

          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected
                    ? AppColors.gradientStart
                    : Theme.of(context).colorScheme.outline,
                width: 2,
              ),
              gradient: isSelected
                  ? const LinearGradient(
                      colors: [AppColors.gradientStart, AppColors.gradientEnd],
                    )
                  : null,
            ),
            child: isSelected
                ? const Icon(Icons.check, color: Colors.white, size: 13)
                : null,
          ),
        ]),
      ),
    );
  }
}
