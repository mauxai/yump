import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/features/video_studio/models/video_editor_models.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoClipEditorDialog extends StatefulWidget {
  final int clipIndex;
  final TimelineClipModel clip;

  const VideoClipEditorDialog({
    super.key,
    required this.clipIndex,
    required this.clip,
  });

  static Future<void> show(BuildContext context, int clipIndex, TimelineClipModel clip) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
      ),
      builder: (_) => VideoClipEditorDialog(clipIndex: clipIndex, clip: clip),
    );
  }

  @override
  State<VideoClipEditorDialog> createState() => _VideoClipEditorDialogState();
}

class _VideoClipEditorDialogState extends State<VideoClipEditorDialog> {
  late int _length;
  late int _trim;
  late String? _transition;
  late String? _filter;

  @override
  void initState() {
    super.initState();
    _length = widget.clip.length;
    _trim = widget.clip.trim;
    _transition = widget.clip.transitionIn;
    _filter = widget.clip.filter;
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
                  Text('edit_clip'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
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
                max: 30,
                divisions: 29,
                activeColor: AppColors.gradientStart,
                label: '$_length s',
                onChanged: (val) {
                  setState(() => _length = val.round());
                  ctrl.updateClipDuration(widget.clipIndex, _length);
                },
              ),
              const SizedBox(height: 12),

              // Trim Slider
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'clip_trim'.trParams({'seconds': '$_trim'}),
                    style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault),
                  ),
                ],
              ),
              Slider(
                value: _trim.toDouble(),
                min: 0,
                max: 30,
                divisions: 30,
                activeColor: AppColors.gradientEnd,
                label: '$_trim s',
                onChanged: (val) {
                  setState(() => _trim = val.round());
                  ctrl.updateClipTrim(widget.clipIndex, _trim);
                },
              ),
              const SizedBox(height: 12),

              // Transition Selector
              Text('transition'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault)),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: AppConstants.videoTransitions.map((t) {
                    final isSelected = (_transition ?? '') == t['value'];
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(t['label']!.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                        selected: isSelected,
                        selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                        onSelected: (_) {
                          final val = t['value']!.isEmpty ? null : t['value'];
                          setState(() => _transition = val);
                          ctrl.setClipTransition(widget.clipIndex, val);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 16),

              // Filter Selector
              Text('filter'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault)),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: AppConstants.videoFilters.map((f) {
                    final isSelected = (_filter ?? '') == f['value'];
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(f['label']!.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                        selected: isSelected,
                        selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                        onSelected: (_) {
                          final val = f['value']!.isEmpty ? null : f['value'];
                          setState(() => _filter = val);
                          ctrl.setClipFilter(widget.clipIndex, val);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 24),

              // Delete Clip Action
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.redAccent,
                    side: const BorderSide(color: Colors.redAccent),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                  ),
                  onPressed: () {
                    ctrl.removeClip(widget.clipIndex);
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.delete_outline, size: 18),
                  label: Text('delete_clip'.tr, style: robotoMedium),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
