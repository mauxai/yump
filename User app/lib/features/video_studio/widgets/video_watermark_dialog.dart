import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoWatermarkDialog extends StatefulWidget {
  const VideoWatermarkDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
      ),
      builder: (_) => const VideoWatermarkDialog(),
    );
  }

  @override
  State<VideoWatermarkDialog> createState() => _VideoWatermarkDialogState();
}

class _VideoWatermarkDialogState extends State<VideoWatermarkDialog> {
  String _url = '';
  String _position = 'topRight';
  double _opacity = 0.85;
  double _scale = 0.15;
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    final ctrl = Get.find<VideoEditorController>();
    if (ctrl.watermark != null) {
      _url = ctrl.watermark!.url;
      _position = ctrl.watermark!.position;
      _opacity = ctrl.watermark!.opacity;
      _scale = ctrl.watermark!.scale;
    }
  }

  Future<void> _pickLogo(VideoEditorController ctrl) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() => _isUploading = true);
      final uploadedUrl = await ctrl.uploadMediaFile(picked.path, mediaType: 'image');
      if (mounted) {
        setState(() {
          _isUploading = false;
          if (uploadedUrl != null) {
            _url = uploadedUrl;
          }
        });
      }
    }
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
                  Text('watermark_branding'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Upload Logo Button & Preview
              if (_url.isEmpty) ...[
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                  ),
                  onPressed: _isUploading ? null : () => _pickLogo(ctrl),
                  icon: _isUploading
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.upload_file_rounded, color: AppColors.gradientStart),
                  label: Text('upload_logo'.tr, style: robotoMedium),
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                    border: Border.all(color: Theme.of(context).colorScheme.outline),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.black26,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Image.network(_url, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.image)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _url.split('/').last,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: robotoMedium,
                        ),
                      ),
                      TextButton(
                        onPressed: () => _pickLogo(ctrl),
                        child: Text('edit'.tr, style: robotoMedium.copyWith(color: AppColors.gradientStart)),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),

              // Corner Position Selector
              Text('watermark_position'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: AppConstants.videoWatermarkPositions.map((pos) {
                  final isSel = _position == pos['value'];
                  return ChoiceChip(
                    label: Text(pos['label']!.tr, style: robotoMedium.copyWith(fontSize: 11)),
                    selected: isSel,
                    selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                    onSelected: (_) => setState(() => _position = pos['value']!),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // Opacity Slider
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('watermark_opacity'.tr, style: robotoMedium),
                  Text('${(_opacity * 100).round()}%', style: robotoBold.copyWith(color: AppColors.gradientStart)),
                ],
              ),
              Slider(
                value: _opacity,
                min: 0.1,
                max: 1.0,
                divisions: 9,
                activeColor: AppColors.gradientStart,
                onChanged: (val) => setState(() => _opacity = val),
              ),
              const SizedBox(height: 12),

              // Scale Slider
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('watermark_scale'.tr, style: robotoMedium),
                  Text('${(_scale * 100).round()}%', style: robotoBold.copyWith(color: AppColors.gradientStart)),
                ],
              ),
              Slider(
                value: _scale,
                min: 0.05,
                max: 0.35,
                divisions: 6,
                activeColor: AppColors.gradientEnd,
                onChanged: (val) => setState(() => _scale = val),
              ),
              const SizedBox(height: 20),

              // Actions
              Row(
                children: [
                  if (_url.isNotEmpty) ...[
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.redAccent,
                          side: const BorderSide(color: Colors.redAccent),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                        ),
                        onPressed: () {
                          ctrl.removeWatermark();
                          Navigator.pop(context);
                        },
                        child: Text('remove_watermark'.tr, style: robotoMedium),
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
                      onPressed: _url.isEmpty
                          ? null
                          : () {
                              ctrl.setWatermark(
                                url: _url,
                                position: _position,
                                opacity: _opacity,
                                scale: _scale,
                              );
                              Navigator.pop(context);
                            },
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
