import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/features/video_studio/models/video_editor_models.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoTextOverlayDialog extends StatefulWidget {
  final int? overlayIndex;
  final TextOverlayModel? overlay;

  const VideoTextOverlayDialog({
    super.key,
    this.overlayIndex,
    this.overlay,
  });

  static Future<void> show(BuildContext context, {int? overlayIndex, TextOverlayModel? overlay}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
      ),
      builder: (_) => VideoTextOverlayDialog(overlayIndex: overlayIndex, overlay: overlay),
    );
  }

  @override
  State<VideoTextOverlayDialog> createState() => _VideoTextOverlayDialogState();
}

class _VideoTextOverlayDialogState extends State<VideoTextOverlayDialog> {
  late final TextEditingController _textController;
  late String _position;
  late String _style;
  late String _size;
  late String _color;
  late String? _background;
  late int _start;
  late int _length;

  final List<String> _presetColors = [
    '#ffffff',
    '#facc15',
    '#ef4444',
    '#22c55e',
    '#06b6d4',
    '#6366f1',
    '#000000',
  ];

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController(text: widget.overlay?.text ?? '');
    _position = widget.overlay?.position ?? 'bottom';
    _style = widget.overlay?.style ?? 'minimal';
    _size = widget.overlay?.size ?? 'medium';
    _color = widget.overlay?.color ?? '#ffffff';
    _background = widget.overlay?.background;
    _start = widget.overlay?.start ?? 0;
    _length = widget.overlay?.length ?? 3;
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _onSave(VideoEditorController ctrl) {
    final text = _textController.text.trim();
    if (text.isEmpty) {
      Navigator.pop(context);
      return;
    }

    if (widget.overlayIndex != null) {
      ctrl.updateTextOverlay(
        widget.overlayIndex!,
        text: text,
        position: _position,
        style: _style,
        size: _size,
        color: _color,
        background: _background,
        start: _start,
        length: _length,
      );
    } else {
      ctrl.addTextOverlay(
        text,
        position: _position,
        style: _style,
        size: _size,
        color: _color,
        background: _background,
        start: _start,
        length: _length,
      );
    }
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<VideoEditorController>();

    return SafeArea(
      child: Container(
        height: MediaQuery.of(context).size.height * 0.8,
        padding: EdgeInsets.only(
          left: Dimensions.paddingSizeLarge,
          right: Dimensions.paddingSizeLarge,
          top: Dimensions.paddingSizeLarge,
          bottom: MediaQuery.of(context).viewInsets.bottom + Dimensions.paddingSizeLarge,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.overlayIndex != null ? 'edit_text'.tr : 'add_text'.tr,
                    style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Caption text input
              TextField(
                controller: _textController,
                autofocus: widget.overlay == null,
                decoration: InputDecoration(
                  hintText: 'overlay_text'.tr,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // 9-Point Screen Alignment Grid
              Text('text_position'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildGridAnchor('topLeft', '↖ TL'),
                        _buildGridAnchor('top', '↑ Top'),
                        _buildGridAnchor('topRight', '↗ TR'),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildGridAnchor('left', '← Left'),
                        _buildGridAnchor('center', '• Center'),
                        _buildGridAnchor('right', 'Right →'),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildGridAnchor('bottomLeft', '↙ BL'),
                        _buildGridAnchor('bottom', '↓ Bottom'),
                        _buildGridAnchor('bottomRight', '↘ BR'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Font Size Selector
              Text('render_resolution'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
              const SizedBox(height: 6),
              Row(
                children: AppConstants.videoTextSizes.map((sz) {
                  final isSel = _size == sz['value'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(sz['label']!.tr, style: robotoMedium.copyWith(fontSize: 11)),
                      selected: isSel,
                      selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                      onSelected: (_) => setState(() => _size = sz['value']!),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),

              // Text Color Palette
              Text('tool_color'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
              const SizedBox(height: 6),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _presetColors.map((colHex) {
                    final clean = colHex.replaceAll('#', '');
                    final color = Color(int.parse('0xFF$clean'));
                    final isSel = _color.toLowerCase() == colHex.toLowerCase();
                    return GestureDetector(
                      onTap: () => setState(() => _color = colHex),
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isSel ? AppColors.gradientStart : Colors.grey.shade400,
                            width: isSel ? 3 : 1,
                          ),
                        ),
                        child: isSel ? Icon(Icons.check, size: 16, color: color == Colors.white ? Colors.black : Colors.white) : null,
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 14),

              // Background Banner Pill
              Text('style_block'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                children: AppConstants.videoTextBackgrounds.map((bg) {
                  final isSel = (_background ?? '') == bg['value'];
                  return ChoiceChip(
                    label: Text(bg['label']!.tr, style: robotoRegular.copyWith(fontSize: 11)),
                    selected: isSel,
                    selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                    onSelected: (_) => setState(() => _background = bg['value']!.isEmpty ? null : bg['value']),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),

              // Start Offset & Duration Sliders
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('soundtrack_start_offset'.trParams({'seconds': '$_start'}), style: robotoMedium),
                ],
              ),
              Slider(
                value: _start.toDouble(),
                min: 0,
                max: 30,
                divisions: 30,
                activeColor: AppColors.gradientEnd,
                label: '$_start s',
                onChanged: (val) => setState(() => _start = val.round()),
              ),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('clip_duration'.trParams({'seconds': '$_length'}), style: robotoMedium),
                ],
              ),
              Slider(
                value: _length.toDouble(),
                min: 1,
                max: 20,
                divisions: 19,
                activeColor: AppColors.gradientStart,
                label: '$_length s',
                onChanged: (val) => setState(() => _length = val.round()),
              ),
              const SizedBox(height: 16),

              // Action Buttons
              Row(
                children: [
                  if (widget.overlayIndex != null) ...[
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.redAccent,
                          side: const BorderSide(color: Colors.redAccent),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                        ),
                        onPressed: () {
                          ctrl.removeTextOverlay(widget.overlayIndex!);
                          Navigator.pop(context);
                        },
                        child: Text('delete'.tr, style: robotoMedium),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.gradientStart,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                      ),
                      onPressed: () => _onSave(ctrl),
                      child: Text('save'.tr, style: robotoMedium),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGridAnchor(String posKey, String label) {
    final isSel = _position == posKey;
    return InkWell(
      onTap: () => setState(() => _position = posKey),
      borderRadius: BorderRadius.circular(4),
      child: Container(
        width: 80,
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: isSel ? AppColors.gradientStart.withValues(alpha: 0.25) : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isSel ? AppColors.gradientStart : Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
            width: isSel ? 2 : 1,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: robotoMedium.copyWith(
            fontSize: 10,
            color: isSel ? AppColors.gradientStart : Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}
