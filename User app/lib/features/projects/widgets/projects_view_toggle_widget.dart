import 'package:flutter/material.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/util/dimensions.dart';

class ProjectsViewToggleWidget extends StatelessWidget {
  final bool isGrid;
  final VoidCallback onToggle;

  const ProjectsViewToggleWidget({
    super.key,
    required this.isGrid,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        _ProjectsToggleButtonWidget(
          icon: Icons.grid_view_rounded,
          active: isGrid,
          onTap: onToggle,
        ),
        _ProjectsToggleButtonWidget(
          icon: Icons.view_list_rounded,
          active: !isGrid,
          onTap: onToggle,
        ),
      ]),
    );
  }
}

class _ProjectsToggleButtonWidget extends StatelessWidget {
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  const _ProjectsToggleButtonWidget({
    required this.icon,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: active ? null : onTap,
      child: Container(
        padding: const EdgeInsets.all(Dimensions.paddingSizeEight),
        decoration: BoxDecoration(
          gradient: active ? AppColors.mainGradient : null,
          borderRadius: BorderRadius.circular(Dimensions.paddingSizeEight),
        ),
        child: Icon(
          icon,
          size: Dimensions.fontSizeExtraLarge,
          color: active
              ? Colors.white
              : Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}
