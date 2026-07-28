import 'package:flutter/material.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class DashboardNavItem extends StatelessWidget {
  final bool isSelected;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const DashboardNavItem({
    super.key,
    required this.isSelected,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final Color color = isSelected
        ? AppColors.gradientEnd
        : Theme.of(context).colorScheme.onSurfaceVariant;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 2),
            Text(
              label,
              style: (isSelected ? robotoMedium : robotoRegular).copyWith(
                color: color,
                fontSize: Dimensions.fontSizeExtraSmall,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
