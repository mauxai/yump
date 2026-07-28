import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/features/update/controllers/update_controller.dart';
import 'package:lumen/features/update/widgets/update_feature_item.dart';
import 'package:lumen/features/update/widgets/update_hero_icon.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class UpdateView extends GetView<UpdateController> {
  const UpdateView({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return PopScope(
      canPop: false,
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraLarge),
            child: Column(
              children: [
                const Spacer(flex: 2),

                const UpdateHeroIcon(),

                const SizedBox(height: Dimensions.paddingSizeExtraMoreLarge),

                Text(
                  'update_available_title'.tr,
                  textAlign: TextAlign.center,
                  style: robotoBold.copyWith(color: colorScheme.onSurface, fontSize: Dimensions.fontSizeOverLarge),
                ),

                const SizedBox(height: Dimensions.paddingSizeSmall),

                Text(
                  'update_available_subtitle'.trParams({'app': AppConstants.appName}),
                  textAlign: TextAlign.center,
                  style: robotoRegular.copyWith(color: colorScheme.onSurfaceVariant, fontSize: Dimensions.fontSizeDefault, height: 1.5),
                ),

                const SizedBox(height: Dimensions.paddingSizeExtraMoreLarge),

                Container(
                  padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(Dimensions.radiusExtraLarge),
                    border: Border.all(color: colorScheme.outlineVariant.withValues(alpha: 0.5)),
                  ),
                  child: Column(
                    children: [
                      UpdateFeatureItem(icon: Icons.bolt_rounded, label: 'update_feature_performance'.tr),

                      const SizedBox(height: Dimensions.paddingSizeDefault),

                      UpdateFeatureItem(icon: Icons.auto_awesome_rounded, label: 'update_feature_tools'.tr),

                      const SizedBox(height: Dimensions.paddingSizeDefault),

                      UpdateFeatureItem(icon: Icons.verified_user_rounded, label: 'update_feature_security'.tr),
                    ],
                  ),
                ),

                const Spacer(flex: 3),

                GetBuilder<UpdateController>(
                  builder: (c) => CustomGradientButton(
                    text: 'update_now'.tr,
                    isLoading: c.isLaunching,
                    onTap: c.launchStore,
                  ),
                ),

                const SizedBox(height: Dimensions.paddingSizeLarge),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
