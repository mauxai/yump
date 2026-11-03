import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoExportBottomSheet extends StatefulWidget {
  const VideoExportBottomSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
      ),
      builder: (_) => const VideoExportBottomSheet(),
    );
  }

  @override
  State<VideoExportBottomSheet> createState() => _VideoExportBottomSheetState();
}

class _VideoExportBottomSheetState extends State<VideoExportBottomSheet> {
  late String _resolution;
  late String _format;
  late String _aspectRatio;

  @override
  void initState() {
    super.initState();
    final ctrl = Get.find<VideoEditorController>();
    _resolution = ctrl.selectedResolution;
    _format = ctrl.selectedFormat;
    _aspectRatio = ctrl.selectedAspectRatio;
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<VideoEditorController>();
    int availableCredits = 0;
    if (Get.isRegistered<ProfileController>()) {
      final user = Get.find<ProfileController>().user;
      final total = user?.creditsTotal ?? 0;
      final used = user?.creditsUsed ?? 0;
      availableCredits = (total - used).clamp(0, 999999);
    }

    const int requiredCredits = 3;
    final hasEnoughCredits = availableCredits >= requiredCredits;

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
                  Text('export_settings'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Auto-detection badge indicator
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.indigo.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                  border: Border.all(color: Colors.indigoAccent.withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.auto_awesome, size: 14, color: Colors.cyanAccent),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Auto-selected best fit: $_aspectRatio • ${_resolution == "1080" ? "1080p Full HD" : _resolution.toUpperCase()}',
                        style: robotoMedium.copyWith(fontSize: 11, color: Colors.cyanAccent),
                      ),
                    ),
                  ],
                ),
              ),

              // Resolution
              Text('render_resolution'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: AppConstants.videoResolutions.map((r) {
                  final isSel = _resolution == r['value'];
                  final isAutoBestFit = ctrl.selectedResolution == r['value'];
                  return ChoiceChip(
                    label: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(r['label']!, style: robotoMedium.copyWith(fontSize: 11)),
                        if (isAutoBestFit) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                            decoration: BoxDecoration(
                              color: Colors.green.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.green, width: 0.5),
                            ),
                            child: const Text('Best Fit', style: TextStyle(fontSize: 8, color: Colors.green, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ],
                    ),
                    selected: isSel,
                    selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                    onSelected: (_) => setState(() => _resolution = r['value']!),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // Format
              Text('render_format'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
              const SizedBox(height: 8),
              Row(
                children: AppConstants.videoFormats.map((f) {
                  final isSel = _format == f;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(f.toUpperCase(), style: robotoBold.copyWith(fontSize: 12)),
                      selected: isSel,
                      selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                      onSelected: (_) => setState(() => _format = f),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // Aspect Ratio
              Text('aspect_ratio'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: AppConstants.videoAspectRatios.map((ratio) {
                    final isSel = _aspectRatio == ratio;
                    final isAutoBestFit = ctrl.selectedAspectRatio == ratio;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(ratio, style: robotoMedium.copyWith(fontSize: 11)),
                            if (isAutoBestFit) ...[
                              const SizedBox(width: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                decoration: BoxDecoration(
                                  color: Colors.green.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: Colors.green, width: 0.5),
                                ),
                                child: const Text('Best Fit', style: TextStyle(fontSize: 8, color: Colors.green, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ],
                        ),
                        selected: isSel,
                        selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                        onSelected: (_) => setState(() => _aspectRatio = ratio),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 20),

              // Credits & Cost Info Card
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  border: Border.all(color: Theme.of(context).colorScheme.outline),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('cost'.tr, style: robotoRegular.copyWith(fontSize: 11)),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.stars_rounded, size: 16, color: Colors.amber),
                            const SizedBox(width: 4),
                            Text(
                              '$requiredCredits ${'credits'.tr}',
                              style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('remaining'.tr, style: robotoRegular.copyWith(fontSize: 11)),
                        const SizedBox(height: 2),
                        Text(
                          '$availableCredits ${'credits'.tr}',
                          style: robotoBold.copyWith(
                            fontSize: Dimensions.fontSizeDefault,
                            color: hasEnoughCredits ? Colors.green : Colors.redAccent,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Confirm Export Button
              CustomGradientButton(
                text: 'confirm_export'.tr,
                isLoading: ctrl.isRendering,
                onTap: () {
                  Navigator.pop(context);
                  ctrl.setResolution(_resolution);
                  ctrl.setFormat(_format);
                  ctrl.setAspectRatio(_aspectRatio);
                  ctrl.submitRender(
                    resolution: _resolution,
                    format: _format,
                    aspectRatio: _aspectRatio,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
