import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/editor/controllers/editor_controller.dart';
import 'package:lumen/util/enums.dart';
import 'package:lumen/features/editor/widgets/tool_button.dart';
import 'package:lumen/util/app_constants.dart';

class EditorToolsRow extends StatelessWidget {
  final EditorController ctrl;

  const EditorToolsRow({super.key, required this.ctrl});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 6),
      child: GetBuilder<EditorController>(builder: (ctrl) {
        final selected = ctrl.selectedTool;
        final isLocked = ctrl.isGenerating;
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: ConstrainedBox(
            constraints: BoxConstraints(minWidth: MediaQuery.of(context).size.width),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: AppConstants.editorTools.map((tool) {
            final id = tool['id'] as EditorTool;
            final isSelected = selected == id;
            return ToolButton(
              icon: tool['icon'] as IconData,
              label: tool['label'] as String,
              isSelected: isSelected,
              onTap: () {
                if (isLocked) return;
                switch (id) {
                  case EditorTool.crop:
                    ctrl.selectTool(EditorTool.crop);
                    if (ctrl.selectedTool == EditorTool.crop) ctrl.clearLasso();
                  case EditorTool.brush:
                    ctrl.clearLasso();
                    ctrl.selectTool(EditorTool.brush);
                  case EditorTool.lasso:
                    ctrl.selectTool(EditorTool.lasso);
                    if (ctrl.selectedTool != EditorTool.lasso) ctrl.clearLasso();
                  case EditorTool.shape:
                    ctrl.clearLasso();
                    ctrl.selectTool(EditorTool.shape);
                  case EditorTool.heal:
                    ctrl.clearLasso();
                    ctrl.selectTool(EditorTool.heal);
                  case EditorTool.color:
                    ctrl.clearLasso();
                    ctrl.selectTool(EditorTool.color);
                }
              },
              );
            }).toList(),
          ),
        ),
      );
      }),
    );
  }
}
