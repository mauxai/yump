import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class OnboardingReleaseBadge extends StatelessWidget {
  const OnboardingReleaseBadge({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(Dimensions.radiusExtraLarge),
        border: Border.all(color: colorScheme.outline),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [

        Container(
          width: 8,height: 8,
          decoration: BoxDecoration(color: colorScheme.secondary, shape: BoxShape.circle),
        ),

        const SizedBox(width: Dimensions.paddingSizeExtraSmall),

        Text( 'new_v2_release'.tr,
          style: robotoMedium.copyWith(color: colorScheme.onSurfaceVariant, fontSize: Dimensions.fontSizeSmall, letterSpacing: 0.5),
        ),

      ]),
    );
  }
}
