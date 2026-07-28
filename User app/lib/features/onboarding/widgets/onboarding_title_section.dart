import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/util/styles.dart';

class OnboardingTitleSection extends StatelessWidget {
  const OnboardingTitleSection({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        Text(
          'onboarding_title'.tr,
          style: robotoBold.copyWith(color: colorScheme.onSurface, fontSize: 36),
        ),
        GradientText(
          'onboarding_subtitle'.tr,
          style: robotoBold.copyWith(fontSize: 36),
        ),
      ],
    );
  }
}
