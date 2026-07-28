import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_colors.dart';
import '../../../util/enums.dart';
import '../controllers/editor_controller.dart';

class ShapePickerBar extends StatelessWidget {
  final EditorController ctrl;

  const ShapePickerBar({super.key, required this.ctrl});

  static const _shapes = [
    (ShapeOption.circle, Icons.circle_outlined, 'Circle'),
    (ShapeOption.square, Icons.crop_square_rounded, 'Square'),
    (ShapeOption.triangle, Icons.change_history_rounded, 'Triangle'),
    (ShapeOption.heart, Icons.favorite_border_rounded, 'Heart'),
    (ShapeOption.star, Icons.star_border_rounded, 'Star'),
  ];

  @override
  Widget build(BuildContext context) {
    return GetBuilder<EditorController>(builder: (ctrl) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(40),
            border: Border.all(color: Theme.of(context).colorScheme.outline),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: _shapes.map((entry) {
              final (shape, icon, _) = entry;
              final isSelected = ctrl.selectedShape == shape;
              return GestureDetector(
                onTap: () => ctrl.setSelectedShape(shape),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: isSelected
                      ? ShaderMask(
                          shaderCallback: (bounds) => const LinearGradient(
                            colors: [AppColors.gradientStart, AppColors.gradientEnd],
                          ).createShader(bounds),
                          child: Icon(icon, color: Colors.white, size: 26),
                        )
                      : Icon(icon, color: Theme.of(context).colorScheme.onSurfaceVariant, size: 26),
                ),
              );
            }).toList(),
          ),
        ),
      );
    });
  }
}
