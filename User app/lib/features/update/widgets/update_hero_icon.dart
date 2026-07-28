import 'package:flutter/material.dart';
import 'package:lumen/core/theme/app_colors.dart';

class UpdateHeroIcon extends StatelessWidget {
  const UpdateHeroIcon({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 132, height: 132,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: AppColors.mainGradient,
        boxShadow: [
          BoxShadow(
            color: AppColors.gradientEnd.withValues(alpha: 0.35),
            blurRadius: 40,
            spreadRadius: 4,
          ),
        ],
      ),
      child: Center(
        child: Container(
          width: 96, height: 96,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.18),
          ),
          child: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 48),
        ),
      ),
    );
  }
}
