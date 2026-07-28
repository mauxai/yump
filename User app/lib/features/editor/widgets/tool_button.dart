import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ToolButton extends StatelessWidget {
  const ToolButton({
    super.key,
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: Dimensions.fontSizeDefault, vertical: Dimensions.paddingSizeEight),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.purpleAccent.withValues(alpha: 0.85)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 1),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ShaderMask(
              shaderCallback: (bounds) => (isSelected
                      ? const LinearGradient(
                          colors: [
                            AppColors.gradientStart,
                            AppColors.gradientEnd,
                          ],
                        )
                      : const LinearGradient(
                          colors: [
                            AppColors.textSecondaryDark,
                            AppColors.textSecondaryDark,
                          ],
                        ))
                  .createShader(bounds),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
            const SizedBox(height: Dimensions.paddingSizeExtraSmall),
            Text(
              label.tr,
              style: (isSelected ? robotoMedium : robotoRegular).copyWith(
                color: isSelected
                    ? Colors.white
                    : Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: Dimensions.fontSizeExtraSmall + 1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
