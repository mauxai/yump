import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class PlanPurchaseSuccessDialog extends StatelessWidget {
  final Plan plan;
  const PlanPurchaseSuccessDialog({super.key, required this.plan});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Dimensions.paddingSizeDefault,
        vertical: Dimensions.paddingSizeLarge,
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
          child: Icon(Icons.check_circle_outline_rounded, color: cs.primary, size: 40),
        ),

        const SizedBox(height: Dimensions.paddingSizeLarge),

        Text(
          'plan_purchase_success_title'.tr,
          textAlign: TextAlign.center,
          style: robotoBold.copyWith(fontSize: Dimensions.fontSizeExtraLarge, color: cs.onSurface),
        ),

        const SizedBox(height: Dimensions.paddingSizeSmall),

        Text(
          'plan_purchase_success_message'.trParams({'credits': '${plan.credits ?? 0}'}),
          textAlign: TextAlign.center,
          style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeDefault, color: cs.onSurfaceVariant),
        ),

        const SizedBox(height: Dimensions.paddingSizeExtraLarge),

        CustomGradientButton(text: 'ok'.tr, onTap: () => Get.back()),
      ]),
    );
  }
}
