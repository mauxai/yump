import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/editor/controllers/editor_controller.dart';
import 'package:lumen/util/styles.dart';

class CropActionsBar extends StatelessWidget {
  final EditorController ctrl;

  const CropActionsBar({super.key, required this.ctrl});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<EditorController>(builder: (ctrl) {
      final generating = ctrl.isGenerating;
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: [
            GestureDetector(
              onTap: generating ? null : ctrl.initCropRect,
              child: Container(
                height: 48,
                width: 48,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Theme.of(context).colorScheme.outline),
                ),
                child: Icon(
                  Icons.refresh_rounded,
                  color: generating
                      ? Theme.of(context).colorScheme.onSurfaceVariant
                      : Theme.of(context).colorScheme.onSurface,
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: generating ? null : ctrl.cancelCrop,
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Theme.of(context).colorScheme.outline),
                  ),
                  child: Center(
                    child: Text(
                      'cancel'.tr,
                      style: robotoMedium.copyWith(
                        color: generating
                            ? Theme.of(context).colorScheme.onSurfaceVariant
                            : Theme.of(context).colorScheme.onSurface,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: GestureDetector(
                onTap: generating ? null : ctrl.applyCrop,
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: generating
                        ? null
                        : const LinearGradient(
                            colors: [AppColors.gradientStart, AppColors.gradientEnd],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                    color: generating ? Theme.of(context).colorScheme.outline : null,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: generating
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.crop_rounded, color: Colors.white, size: 18),
                              const SizedBox(width: 8),
                              Text('crop_apply'.tr, style: robotoMedium.copyWith(color: Colors.white, fontSize: 15)),
                            ],
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    });
  }
}
