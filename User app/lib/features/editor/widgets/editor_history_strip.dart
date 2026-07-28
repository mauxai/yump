import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/editor/controllers/editor_controller.dart';
import 'package:lumen/features/editor/widgets/history_thumbnail.dart';

class EditorHistoryStrip extends StatefulWidget {
  final EditorController ctrl;

  const EditorHistoryStrip({super.key, required this.ctrl});

  @override
  State<EditorHistoryStrip> createState() => _EditorHistoryStripState();
}

class _EditorHistoryStripState extends State<EditorHistoryStrip> {
  final ScrollController _scrollCtrl = ScrollController();

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<EditorController>(builder: (ctrl) {
      final originalBytes = ctrl.originalImageBytes ?? ctrl.imageBytes;
      final history = ctrl.editHistory;
      if (originalBytes == null || history.isEmpty) return const SizedBox.shrink();

      final selected = ctrl.currentIndex;
      final visualIndex = selected + 1;

      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_scrollCtrl.hasClients) return;
        const itemWidth = 64.0;
        final viewportWidth = _scrollCtrl.position.viewportDimension;
        final target = (visualIndex * itemWidth) - (viewportWidth / 2) + (56 / 2);
        _scrollCtrl.animateTo(
          target.clamp(0.0, _scrollCtrl.position.maxScrollExtent),
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        );
      });

      return SizedBox(
        height: 80,
        child: ListView.builder(
          controller: _scrollCtrl,
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          itemCount: 1 + history.length,
          itemBuilder: (context, i) {
            final isSelected = (i == 0 && selected == -1) || (i > 0 && selected == i - 1);
            final label = i == 0 ? 'history_original'.tr : 'v$i';
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: HistoryThumbnail(
                imageBytes: i == 0 ? originalBytes : null,
                imageUrl: i == 0 ? null : history[i - 1].image,
                label: label,
                isSelected: isSelected,
                onTap: ctrl.isGenerating ? () {} : () => ctrl.jumpToVersion(i == 0 ? -1 : i - 1),
              ),
            );
          },
        ),
      );
    });
  }
}
