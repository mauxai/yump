import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/common/widgets/exit_confirm_dialog.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';
import '../controllers/onboarding_controller.dart';
import '../widgets/onboarding_stacked_cards.dart';
import '../widgets/onboarding_title_section.dart';

class OnboardingView extends GetView<OnboardingController> {
  const OnboardingView({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        await ExitConfirmDialog.handleBack(context);
      },
      child: Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraLarge),
          child: Column(
            children: [
              const SizedBox(height: 48),
              const Expanded(child: OnboardingStackedCards()),
              const SizedBox(height: 32),
              //const OnboardingReleaseBadge(),
              const SizedBox(height: 16),
              const OnboardingTitleSection(),
              const SizedBox(height: 12),
              Text(
                'onboarding_description'.tr,
                textAlign: TextAlign.center,
                style: robotoRegular.copyWith(color: colorScheme.onSurfaceVariant, fontSize: Dimensions.fontSizeDefault),
              ),
              const SizedBox(height: 32),
              CustomGradientButton(text: 'get_started'.tr, onTap: controller.getStarted),
              const SizedBox(height: 16),
              // Text(
              //   'free_edits_footer'.tr,
              //   textAlign: TextAlign.center,
              //   style: robotoRegular.copyWith(color: colorScheme.onSurfaceVariant, fontSize: Dimensions.fontSizeSmall + 1),
              // ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      ),
    );
  }
}
