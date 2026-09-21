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
  late int _start;
  late int _length;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController(text: widget.overlay?.text ?? '');
    _position = widget.overlay?.position ?? 'bottom';
    _style = widget.overlay?.style ?? 'minimal';
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
        start: _start,
        length: _length,
      );
    } else {
      ctrl.addTextOverlay(
        text,
        position: _position,
        style: _style,
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
      child: Padding(
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
              const SizedBox(height: 12),

              // Caption text input
              TextField(
                controller: _textController,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'overlay_text'.tr,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Position Selector
              Text('text_position'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault)),
              const SizedBox(height: 6),
              Row(
                children: AppConstants.videoTextPositions.map((p) {
                  final isSelected = _position == p['value'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(p['label']!.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                      selected: isSelected,
                      selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                      onSelected: (_) => setState(() => _position = p['value']!),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // Style Selector
              Text('text_style'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault)),
              const SizedBox(height: 6),
              Row(
                children: AppConstants.videoTextStyles.map((s) {
                  final isSelected = _style == s['value'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(s['label']!.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                      selected: isSelected,
                      selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                      onSelected: (_) => setState(() => _style = s['value']!),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // Duration Slider
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'clip_duration'.trParams({'seconds': '$_length'}),
                    style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault),
                  ),
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
              const SizedBox(height: 20),

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
}
