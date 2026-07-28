import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/features/upgrade/controllers/upgrade_controller.dart';
import 'package:lumen/helper/price_converter.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class UpgradePlanCardItem extends StatelessWidget {
  final Plan plan;
  final PlanButtonState buttonState;
  final bool isCurrentPlan;
  final VoidCallback onTap;

  const UpgradePlanCardItem({
    super.key,
    required this.plan,
    required this.buttonState,
    required this.isCurrentPlan,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final body = _CardBody(
      plan: plan,
      buttonState: buttonState,
      isCurrentPlan: isCurrentPlan,
      onTap: onTap,
    );

    if (isCurrentPlan) {
      return Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
          ),
          borderRadius: BorderRadius.all(Radius.circular(18)),
        ),
        padding: const EdgeInsets.all(2),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: body,
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: body,
    );
  }
}

class _CardBody extends StatelessWidget {
  final Plan plan;
  final PlanButtonState buttonState;
  final bool isCurrentPlan;
  final VoidCallback onTap;

  const _CardBody({
    required this.plan,
    required this.buttonState,
    required this.isCurrentPlan,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Theme.of(context).cardColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isCurrentPlan) const _CurrentPlanBanner(),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (plan.recommended == true) ...[
                  const _RecommendedBadge(),
                  const SizedBox(height: 10),
                ],

                Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                    Expanded(
                      child: Text(
                        plan.name ?? '',
                        style: robotoBold.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontSize: Dimensions.fontSizeLarge,
                        ),
                      ),
                    ),

                    _CreditsChip(credits: plan.credits ?? 0),
                  ]),

                const SizedBox(height: 10),

                Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                    Text(PriceConverter.convertPrice(plan.price),
                      style: robotoBold.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontSize: Dimensions.fontSizeOverLarge,
                      ),
                    ),

                    const Spacer(),

                    _PlanButton(state: buttonState, onTap: onTap),
                  ]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CreditsChip extends StatelessWidget {
  final int credits;
  const _CreditsChip({required this.credits});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.gradientStart.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.bolt, color: AppColors.gradientStart, size: 14),
        const SizedBox(width: 3),
        Text(
          'plan_credits'.trParams({'credits': '$credits'}),
          style: robotoMedium.copyWith(
            color: AppColors.gradientStart,
            fontSize: Dimensions.fontSizeSmall,
          ),
        ),
      ]),
    );
  }
}

class _RecommendedBadge extends StatelessWidget {
  const _RecommendedBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.gradientEnd],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        'recommended'.tr,
        style: robotoBold.copyWith(color: Colors.white, fontSize: 10, letterSpacing: 0.5),
      ),
    );
  }
}

class _CurrentPlanBanner extends StatelessWidget {
  const _CurrentPlanBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.gradientStart, AppColors.gradientEnd],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.check_circle, color: Colors.white, size: 14),
        const SizedBox(width: 6),
        Text(
          'your_current_plan'.tr,
          style: robotoMedium.copyWith(color: Colors.white, fontSize: 12),
        ),
      ]),
    );
  }
}

class _PlanButton extends StatelessWidget {
  final PlanButtonState state;
  final VoidCallback onTap;

  const _PlanButton({required this.state, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isGradient = state == PlanButtonState.upgrade || state == PlanButtonState.purchaseAgain;
    final isDisabled = state == PlanButtonState.active;

    final label = switch (state) {
      PlanButtonState.active       => 'active'.tr,
      PlanButtonState.purchaseAgain => 'purchase_again'.tr,
      PlanButtonState.upgrade      => 'upgrade'.tr,
      PlanButtonState.downgrade    => 'downgrade'.tr,
    };

    if (isGradient) {
      return GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.gradientStart, AppColors.gradientEnd],
            ),
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(
              label,
              style: robotoBold.copyWith(color: Colors.white, fontSize: Dimensions.fontSizeSmall),
            ),
            if (state == PlanButtonState.upgrade) ...[
              const SizedBox(width: 4),
              const Icon(Icons.arrow_forward, color: Colors.white, size: 13),
            ],
          ]),
        ),
      );
    }

    return GestureDetector(
      onTap: isDisabled ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          border: Border.all(
            color: isDisabled
                ? Theme.of(context).colorScheme.outline
                : Theme.of(context).colorScheme.onSurface,
          ),
        ),
        child: Text(
          label,
          style: robotoMedium.copyWith(
            color: isDisabled
                ? Theme.of(context).colorScheme.onSurfaceVariant
                : Theme.of(context).colorScheme.onSurface,
            fontSize: Dimensions.fontSizeSmall,
          ),
        ),
      ),
    );
  }
}
