import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/editor/controllers/editor_controller.dart';
import 'package:lumen/features/editor/widgets/top_bar_icon_button.dart';
import 'package:lumen/util/styles.dart';

class EditorTopBar extends StatelessWidget {
  final EditorController ctrl;
  final VoidCallback? onBack;

  const EditorTopBar({super.key, required this.ctrl, this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Row(
        children: [
          TopBarIconButton(
            icon: Icons.arrow_back_ios_new_rounded,
            onTap: onBack ?? Get.back,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: GetBuilder<EditorController>(builder: (ctrl) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      ctrl.projectName,
                      style: robotoBold.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontSize: 16,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (ctrl.versionLabel.isNotEmpty)
                      Text(
                        ctrl.versionLabel,
                        style: robotoRegular.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 12,
                        ),
                      ),
                  ],
                )),
          ),
          const SizedBox(width: 8),
          GetBuilder<EditorController>(builder: (ctrl) => TopBarIconButton(
                icon: Icons.undo_rounded,
                onTap: ctrl.canUndo ? ctrl.undo : null,
              )),
          const SizedBox(width: 6),
          GetBuilder<EditorController>(builder: (ctrl) => TopBarIconButton(
                icon: Icons.redo_rounded,
                onTap: ctrl.canRedo ? ctrl.redo : null,
              )),
          const SizedBox(width: 10),
          _SaveButton(onTap: ctrl.saveImage),
        ],
      ),
    );
  }
}

class _SaveButton extends StatelessWidget {
  final VoidCallback onTap;

  const _SaveButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.download_rounded, color: Colors.white, size: 16),
            const SizedBox(width: 6),
            Text(
              'save'.tr,
              style: robotoMedium.copyWith(
                color: Colors.white,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
