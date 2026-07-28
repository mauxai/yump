import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_colors.dart';
import '../../../util/styles.dart';

class LassoAreaChip extends StatelessWidget {
  const LassoAreaChip({super.key, required this.areaPercent});

  final double areaPercent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(20),
      ),
      child: ShaderMask(
        shaderCallback: (bounds) => const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.gradientEnd],
        ).createShader(bounds),
        child: Text(
          'lasso_area_label'.trParams({'percent': areaPercent.toStringAsFixed(0)}),
          style: robotoBold.copyWith(
            color: Colors.white,
            fontSize: 11,
            letterSpacing: 1.1,
          ),
        ),
      ),
    );
  }
}
