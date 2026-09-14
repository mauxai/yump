import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/common/widgets/custom_appbar_widget.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_studio_controller.dart';
import 'package:lumen/features/video_studio/models/video_models.dart';
import 'package:lumen/features/video_studio/widgets/video_player_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoStudioView extends GetView<VideoStudioController> {
  const VideoStudioView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: CustomAppBar(
        title: 'video_studio'.tr,
        showBackButton: true,
      ),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(Dimensions.paddingSizeLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _VideoFormSection(),
            SizedBox(height: 24),
            _VideoGallerySection(),
          ],
        ),
      ),
    );
  }
}

class _VideoFormSection extends StatefulWidget {
  const _VideoFormSection();

  @override
  State<_VideoFormSection> createState() => _VideoFormSectionState();
}

class _VideoFormSectionState extends State<_VideoFormSection> {
  final TextEditingController _promptController = TextEditingController();
  final TextEditingController _negativePromptController = TextEditingController();
  bool _showNegative = false;

  static const List<String> _promptEnhancements = [
    'cinematic dynamic camera pan, volumetric lighting, photorealistic 8k, smooth motion',
    'slow-motion fluid movement, exquisite textures, macro studio glow, cinematic depth',
    'dramatic orbital camera movement, high visual fidelity, seamless lighting transitions',
  ];

  @override
  void dispose() {
    _promptController.dispose();
    _negativePromptController.dispose();
    super.dispose();
  }

  void _enhancePrompt() {
    final current = _promptController.text.trim();
    if (current.isEmpty) return;
    final enhancement = (_promptEnhancements..shuffle()).first;
    _promptController.text = '$current, $enhancement';
    setState(() {});
  }

  Future<void> _pickImage(VideoStudioController ctrl) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      ctrl.setSourceImage(File(picked.path));
    }
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoStudioController>(
      builder: (ctrl) {
        final model = ctrl.selectedModel;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
            border: Border.all(color: Theme.of(context).colorScheme.outline),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('generation_mode'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.gradientStart.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.stars_rounded, color: AppColors.gradientStart, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          '${model.creditCost} ${'credits'.tr}',
                          style: robotoMedium.copyWith(color: AppColors.gradientStart, fontSize: Dimensions.fontSizeExtraSmall),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Model selector dropdown / chips
              Text('ai_model'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).colorScheme.onSurfaceVariant)),
              const SizedBox(height: 6),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ctrl.models.map((m) {
                    final isSelected = m.key == model.key;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(m.name, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall)),
                        selected: isSelected,
                        selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                        onSelected: (_) => ctrl.selectModel(m),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 16),

              // Source Image (for Image-to-Video) if model supports it
              if (model.supportsI2V) ...[
                Text('source_image_optional'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                const SizedBox(height: 6),
                if (ctrl.sourceImageFile != null)
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                        child: Image.file(
                          ctrl.sourceImageFile!,
                          height: 100,
                          width: 140,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: ctrl.clearSourceImage,
                          child: Container(
                            decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                            padding: const EdgeInsets.all(4),
                            child: const Icon(Icons.close, color: Colors.white, size: 14),
                          ),
                        ),
                      ),
                    ],
                  )
                else
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                    ),
                    onPressed: () => _pickImage(ctrl),
                    icon: const Icon(Icons.add_photo_alternate_outlined, size: 18),
                    label: Text('upload_base_image'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                  ),
                const SizedBox(height: 16),
              ],

              // Prompt Input with Enhancer
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('video_prompt'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                  TextButton.icon(
                    onPressed: _enhancePrompt,
                    icon: const Icon(Icons.auto_awesome, size: 14, color: AppColors.gradientStart),
                    label: Text('enhance'.tr, style: robotoMedium.copyWith(fontSize: 12, color: AppColors.gradientStart)),
                  ),
                ],
              ),
              TextField(
                controller: _promptController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'describe_video_prompt'.tr,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                    borderSide: BorderSide(color: Theme.of(context).colorScheme.outline),
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Negative Prompt toggle
              GestureDetector(
                onTap: () => setState(() => _showNegative = !_showNegative),
                child: Row(
                  children: [
                    Icon(_showNegative ? Icons.remove_circle_outline : Icons.add_circle_outline, size: 16, color: AppColors.gradientStart),
                    const SizedBox(width: 6),
                    Text('negative_prompt'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: AppColors.gradientStart)),
                  ],
                ),
              ),
              if (_showNegative) ...[
                const SizedBox(height: 8),
                TextField(
                  controller: _negativePromptController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: 'negative_prompt_hint'.tr,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                      borderSide: BorderSide(color: Theme.of(context).colorScheme.outline),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),

              // Aspect Ratio Chips
              Text('aspect_ratio'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).colorScheme.onSurfaceVariant)),
              const SizedBox(height: 6),
              Row(
                children: model.aspectRatios.map((ratio) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(ratio),
                      selected: ctrl.selectedAspectRatio == ratio,
                      selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                      onSelected: (_) => ctrl.selectAspectRatio(ratio),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // Duration Chips
              Text('duration_seconds'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).colorScheme.onSurfaceVariant)),
              const SizedBox(height: 6),
              Row(
                children: model.durations.map((d) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text('${d}s'),
                      selected: ctrl.selectedDuration == d,
                      selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                      onSelected: (_) => ctrl.selectDuration(d),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              CustomGradientButton(
                text: ctrl.isGenerating ? 'generating'.tr : 'generate_video'.tr,
                isLoading: ctrl.isGenerating,
                onTap: () {
                  ctrl.generateVideo(
                    _promptController.text,
                    negativePrompt: _showNegative ? _negativePromptController.text : null,
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class _VideoGallerySection extends StatelessWidget {
  const _VideoGallerySection();

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoStudioController>(
      builder: (ctrl) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('video_creations'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
            const SizedBox(height: 12),
            if (ctrl.isLoadingGallery)
              const Center(child: CircularProgressIndicator(strokeWidth: 2))
            else if (ctrl.videoGallery.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'no_videos_yet'.tr,
                    style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: ctrl.videoGallery.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) {
                  final video = ctrl.videoGallery[i];
                  return _VideoItemCard(video: video);
                },
              ),
          ],
        );
      },
    );
  }
}

class _VideoItemCard extends StatelessWidget {
  final VideoRecord video;

  const _VideoItemCard({required this.video});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<VideoStudioController>();

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ListTile(
            title: Text(
              video.prompt,
              style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            subtitle: Text(
              '${video.aspectRatio} • ${video.duration}s',
              style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeExtraSmall, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            trailing: PopupMenuButton<String>(
              onSelected: (action) {
                if (action == 'delete') {
                  ctrl.deleteVideo(video.id);
                }
              },
              itemBuilder: (_) => [
                PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      const Icon(Icons.delete_outline, color: Colors.redAccent, size: 16),
                      const SizedBox(width: 8),
                      Text('delete'.tr, style: const TextStyle(color: Colors.redAccent)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (video.isProcessing)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                  const SizedBox(width: 12),
                  Text('video_processing_status'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                ],
              ),
            )
          else if (video.isCompleted)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gradientStart,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (_) => VideoPlayerWidget(video: video),
                  );
                },
                icon: const Icon(Icons.play_arrow_rounded),
                label: Text('play_video'.tr),
              ),
            )
          else if (video.isFailed)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Text(
                '${'failed'.tr}: ${video.errorMessage ?? 'error_occurred'.tr}',
                style: robotoRegular.copyWith(color: Colors.redAccent, fontSize: Dimensions.fontSizeSmall),
              ),
            ),
        ],
      ),
    );
  }
}
