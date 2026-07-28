import 'package:flutter/material.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class UpdateFeatureItem extends StatelessWidget {
  final IconData icon;
  final String label;

  const UpdateFeatureItem({super.key, required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(children: [
      Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: AppColors.gradientStart.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        ),
        child: Icon(icon, color: AppColors.gradientStart, size: 20),
      ),

      const SizedBox(width: Dimensions.paddingSizeDefault),

      Expanded(
        child: Text(
          label,
          style: robotoRegular.copyWith(color: colorScheme.onSurface, fontSize: Dimensions.fontSizeDefault),
        ),
      ),
    ]);
  }
}
