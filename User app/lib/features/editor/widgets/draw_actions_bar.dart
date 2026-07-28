import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_colors.dart';
import '../../../util/styles.dart';
import '../controllers/editor_controller.dart';

class DrawActionsBar extends StatelessWidget {
  final EditorController ctrl;

  const DrawActionsBar({super.key, required this.ctrl});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<EditorController>(builder: (ctrl) {
      final canUndo = ctrl.drawStrokes.isNotEmpty;
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: [
            _IconBtn(icon: Icons.undo_rounded, onTap: canUndo ? ctrl.undoStroke : null, enabled: canUndo),
            const SizedBox(width: 10),
            Expanded(
              child: _TextBtn(
                label: 'draw_clear_all'.tr,
                icon: Icons.delete_outline_rounded,
                onTap: canUndo ? ctrl.clearStrokes : null,
                enabled: canUndo,
                filled: false,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: _TextBtn(
                label: canUndo ? 'draw_done'.tr : 'draw_close'.tr,
                icon: canUndo ? Icons.check_rounded : Icons.close_rounded,
                onTap: ctrl.doneBrush,
                enabled: true,
                filled: canUndo,
              ),
            ),
          ],
        ),
      );
    });
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final bool enabled;

  const _IconBtn({required this.icon, required this.onTap, required this.enabled});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: Icon(icon, size: 20,
            color: enabled ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurfaceVariant),
      ),
    );
  }
}

class _TextBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onTap;
  final bool enabled;
  final bool filled;

  const _TextBtn({required this.label, required this.icon, required this.onTap, required this.enabled, required this.filled});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          gradient: filled && enabled
              ? const LinearGradient(
                  colors: [AppColors.gradientStart, AppColors.gradientEnd],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                )
              : null,
          color: filled && enabled ? null : enabled ? Theme.of(context).colorScheme.surface : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(14),
          border: filled && enabled ? null : Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: filled && enabled ? Colors.white
                    : enabled
                        ? Theme.of(context).colorScheme.onSurface
                        : Theme.of(context).colorScheme.onSurfaceVariant),
            const SizedBox(width: 6),
            Text(label,
                style: robotoMedium.copyWith(
                  fontSize: 14,
                  color: filled && enabled
                      ? Colors.white
                      : enabled
                          ? Theme.of(context).colorScheme.onSurface
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                )),
          ],
        ),
      ),
    );
  }
}
