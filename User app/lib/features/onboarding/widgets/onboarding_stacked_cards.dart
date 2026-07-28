import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'onboarding_image_card.dart';

class OnboardingStackedCards extends StatelessWidget {
  const OnboardingStackedCards({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 300,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Transform.rotate(
            angle: -5 * math.pi / 180,
            child: Transform.translate(
              offset: const Offset(-60, 10),
              child: const OnboardingImageCard(
                width: 200,
                height: 260,
                glowColor: AppColors.tealAccent,
                gradientBegin: Alignment.topLeft,
                gradientEnd: Alignment.bottomRight,
              ),
            ),
          ),
          Transform.rotate(
            angle: 3 * math.pi / 180,
            child: Transform.translate(
              offset: const Offset(60, 10),
              child: const OnboardingImageCard(
                width: 200,
                height: 260,
                glowColor: AppColors.purpleAccent,
                gradientBegin: Alignment.topRight,
                gradientEnd: Alignment.bottomLeft,
              ),
            ),
          ),
          const OnboardingImageCard(
            width: 210,
            height: 270,
            glowColor: AppColors.purpleAccent,
            isCenter: true,
          ),
        ],
      ),
    );
  }
}
