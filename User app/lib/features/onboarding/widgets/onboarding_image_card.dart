import 'package:flutter/material.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class OnboardingImageCard extends StatelessWidget {
  final double width;
  final double height;
  final Color glowColor;
  final AlignmentGeometry gradientBegin;
  final AlignmentGeometry gradientEnd;
  final bool isCenter;

  const OnboardingImageCard({
    super.key,
    required this.width,
    required this.height,
    required this.glowColor,
    this.gradientBegin = Alignment.topCenter,
    this.gradientEnd = Alignment.bottomCenter,
    this.isCenter = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final scaffoldBg = Theme.of(context).scaffoldBackgroundColor;

    return Container(
      width: width, height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: gradientBegin, end: gradientEnd,
          colors: [glowColor.withValues(alpha: 0.15), scaffoldBg],
        ),
        borderRadius: BorderRadius.circular(Dimensions.radiusExtraLarge),
        border: Border.all(color: colorScheme.outline, width: 1),
        boxShadow: [
          BoxShadow(color: glowColor.withValues(alpha: 0.3), blurRadius: 30, spreadRadius: 5),
        ],
      ),
      child: Stack(children: [

        Positioned(
          top: Dimensions.paddingSizeLarge, left: Dimensions.paddingSizeLarge,
          child: Container(
            width: 100, height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [glowColor.withValues(alpha: 0.4), glowColor.withValues(alpha: 0)],
              ),
            ),
          ),
        ),

        Positioned(
          bottom: 40, left: 16, right: 16,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

            Container(
              height: 6, width: double.infinity,
              decoration: BoxDecoration(color: colorScheme.outline, borderRadius: BorderRadius.circular(3)),
            ),

            const SizedBox(height: Dimensions.paddingSizeEight),

            Container(
              height: 6, width: 80,
              decoration: BoxDecoration(color: colorScheme.outline, borderRadius: BorderRadius.circular(3)),
            ),

          ]),
        ),

        if (isCenter)
          Positioned(
            top: 16, right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeEight, vertical: 4),
              decoration: BoxDecoration(color: colorScheme.outline, borderRadius: BorderRadius.circular(Dimensions.paddingSizeEight)),
              child: Text('v${AppConstants.appVersion}', style: robotoMedium.copyWith(color: colorScheme.onSurfaceVariant, fontSize: 11)),
            ),
          ),

      ]),
    );
  }
}
