import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class PaymentFailedDialog extends StatelessWidget {
  const PaymentFailedDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(mainAxisSize: MainAxisSize.min, children: [
      const SizedBox(height: Dimensions.paddingSizeLarge),

      Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          color: const Color(0xFFFF3B30).withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.error_outline_rounded, color: Color(0xFFFF3B30), size: 40),
      ),

      const SizedBox(height: Dimensions.paddingSizeLarge),

      Text(
        'payment_failed_title'.tr,
        textAlign: TextAlign.center,
        style: robotoBold.copyWith(fontSize: Dimensions.fontSizeExtraLarge, color: cs.onSurface),
      ),

      const SizedBox(height: Dimensions.paddingSizeSmall),

      Text(
        'payment_failed_message'.tr,
        textAlign: TextAlign.center,
        style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeDefault, color: cs.onSurfaceVariant),
      ),

      const SizedBox(height: Dimensions.paddingSizeExtraLarge),

      SizedBox(
        width: double.infinity,
        height: 48,
        child: TextButton(
          onPressed: () => Get.offAllNamed(RouteHelper.getDashboardRoute()),
          style: TextButton.styleFrom(
            backgroundColor: const Color(0xFFFF3B30),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusSmall)),
            padding: EdgeInsets.zero,
          ),
          child: Text('payment_failed_continue'.tr, style: robotoBold.copyWith(color: Colors.white, fontSize: Dimensions.fontSizeDefault)),
        ),
      ),

      const SizedBox(height: Dimensions.paddingSizeSmall),
    ]);
  }
}
