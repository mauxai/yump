import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/editor/controllers/editor_controller.dart';
import 'package:lumen/features/editor/widgets/editing_in_progress_dialog.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/enums.dart';
import 'package:lumen/features/editor/widgets/brush_settings_bar.dart';
import 'package:lumen/features/editor/widgets/crop_actions_bar.dart';
import 'package:lumen/features/editor/widgets/crop_aspect_ratio_bar.dart';
import 'package:lumen/features/editor/widgets/draw_actions_bar.dart';
import 'package:lumen/features/editor/widgets/editor_canvas.dart';
import 'package:lumen/features/editor/widgets/editor_history_strip.dart';
import 'package:lumen/features/editor/widgets/editor_prompt_input.dart';
import 'package:lumen/features/editor/widgets/editor_tools_row.dart';
import 'package:lumen/features/editor/widgets/editor_top_bar.dart';
import 'package:lumen/features/editor/widgets/heal_actions_bar.dart';
import 'package:lumen/features/editor/widgets/color_tuning_bar.dart';
import 'package:lumen/features/editor/widgets/shape_picker_bar.dart';

class EditorView extends StatefulWidget {
  final String imagePath;
  final String projectName;
  final String? initialPrompt;
  final String? projectId;
  final bool fromNotification;

  const EditorView({
    super.key,
    required this.imagePath,
    required this.projectName,
    this.initialPrompt,
    this.projectId,
    this.fromNotification = false,
  });

  @override
  State<EditorView> createState() => _EditorViewState();
}

class _EditorViewState extends State<EditorView> {
  late final EditorController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = Get.find<EditorController>();
    _ctrl.init(
      widget.imagePath,
      widget.projectName,
      projectId: widget.projectId,
    );
  }

  Future<bool> _confirmBack() async {
    if (!_ctrl.isGenerating) return true;
    if (!mounted) return true;
    return EditingInProgressDialog.show(context);
  }

  void _handleBack() {
    if (widget.fromNotification) {
      Get.offAllNamed(RouteHelper.getDashboardRoute());
    } else {
      Get.back();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (await _confirmBack() && mounted) _handleBack();
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: SafeArea(
          child: Column(
            children: [
              EditorTopBar(ctrl: _ctrl, onBack: () async {
                if (await _confirmBack()) _handleBack();
              }),

              Expanded(child: EditorCanvas(ctrl: _ctrl)),

              // Only the bottom section rebuilds on every update() call.
              GetBuilder<EditorController>(builder: (ctrl) {
                final isCropActive = ctrl.selectedTool == EditorTool.crop;
                final isBrushActive = ctrl.selectedTool == EditorTool.brush;

                if (isCropActive) {
                  return Column(mainAxisSize: MainAxisSize.min, children: [
                    CropAspectRatioBar(ctrl: ctrl),
                    const SizedBox(height: 8),
                    CropActionsBar(ctrl: ctrl),
                    const SizedBox(height: 12),
                  ]);
                }

                if (isBrushActive) {
                  return Column(mainAxisSize: MainAxisSize.min, children: [
                    BrushSettingsBar(ctrl: ctrl),
                    const SizedBox(height: 8),
                    DrawActionsBar(ctrl: ctrl),
                    const SizedBox(height: 12),
                  ]);
                }

                if (ctrl.selectedTool == EditorTool.heal) {
                  return const Column(mainAxisSize: MainAxisSize.min, children: [
                    HealActionsBar(),
                    SizedBox(height: 12),
                  ]);
                }

                if (ctrl.selectedTool == EditorTool.color) {
                  return const Column(mainAxisSize: MainAxisSize.min, children: [
                    ColorTuningBar(),
                    SizedBox(height: 12),
                  ]);
                }

                return Column(mainAxisSize: MainAxisSize.min, children: [
                  AnimatedSize(
                    duration: const Duration(milliseconds: 280),
                    curve: Curves.easeInOut,
                    child: EditorHistoryStrip(ctrl: ctrl),
                  ),

                  if (ctrl.selectedTool == EditorTool.shape) ...[
                    const SizedBox(height: 6),
                    ShapePickerBar(ctrl: ctrl),
                  ],

                  EditorToolsRow(ctrl: ctrl),
                  const SizedBox(height: 6),
                  EditorPromptInput(ctrl: ctrl, initialPrompt: widget.initialPrompt),
                  const SizedBox(height: 12),
                ]);
              }),
            ],
          ),
        ),
      ),
    );
  }
}
