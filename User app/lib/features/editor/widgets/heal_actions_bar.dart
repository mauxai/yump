import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/editor/controllers/editor_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class HealActionsBar extends StatelessWidget {
  const HealActionsBar({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<EditorController>(
      builder: (ctrl) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            border: Border(top: BorderSide(color: Theme.of(context).colorScheme.outline)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: ctrl.clearHealStrokes,
                icon: const Icon(Icons.clear_all, size: 18),
                label: Text('clear'.tr),
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gradientStart,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: ctrl.isGenerating ? null : ctrl.applySpotHeal,
                icon: const Icon(Icons.auto_fix_high, size: 16),
                label: Text('apply_heal'.tr),
              ),
            ],
          ),
        );
      },
    );
  }
}
