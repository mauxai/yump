import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/editor/controllers/editor_controller.dart';
import 'package:lumen/util/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../util/styles.dart';

class CropAspectRatioBar extends StatelessWidget {
  final EditorController ctrl;

  const CropAspectRatioBar({super.key, required this.ctrl});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<EditorController>(builder: (ctrl) {
      return SizedBox(
        height: 40,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          children: AppConstants.cropAspectRatios.map((r) {
            final value = r['value'] as String;
            final label = r['label'] as String;
            final isSelected = ctrl.cropAspectRatio == value;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () => ctrl.applyAspectRatioPreset(value),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? const LinearGradient(
                            colors: [AppColors.gradientStart, AppColors.gradientEnd],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          )
                        : null,
                    color: isSelected ? null : Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: isSelected ? null : Border.all(color: Theme.of(context).colorScheme.outline),
                  ),
                  child: Text(
                    label,
                    style: (isSelected ? robotoMedium : robotoRegular).copyWith(
                      color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurfaceVariant,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      );
    });
  }
}
