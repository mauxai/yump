import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lumen/common/widgets/custom_appbar_widget.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/image_studio/controllers/image_studio_controller.dart';
import 'package:lumen/features/image_studio/models/image_models.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ImageStudioView extends StatelessWidget {
  const ImageStudioView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: CustomAppBar(
        title: 'image_studio'.tr.isNotEmpty ? 'image_studio'.tr : 'Image Studio',
        showBackButton: true,
      ),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(Dimensions.paddingSizeDefault),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ImageFormSection(),
            SizedBox(height: 20),
            _ActiveImageSection(),
            SizedBox(height: 20),
            _ImageGallerySection(),
          ],
        ),
      ),
    );
  }
}

class _ImageFormSection extends StatefulWidget {
  const _ImageFormSection();

  @override
  State<_ImageFormSection> createState() => _ImageFormSectionState();
}

class _ImageFormSectionState extends State<_ImageFormSection> {
  final TextEditingController _promptController = TextEditingController();

  static const List<String> _promptEnhancements = [
    'photorealistic, 8k resolution, cinematic lighting, volumetric atmosphere, octane render',
    'exquisite studio portrait, natural textures, warm rim light, sharp focus, award-winning photography',
    'hyper-detailed digital art, rich color palette, dramatic highlights, trending on artstation',
    'dramatic natural daylight, high visual fidelity, photorealistic depth, realistic shadows',
  ];

  static const List<String> _inspirationChips = [
    'Futuristic sports car in neon rain, 8k photorealistic',
    'Studio portrait of an elderly watchmaker, dramatic rim lighting',
    'Whimsical watercolor fairy cottage in a misty forest',
    '3D animated fluffy baby red panda, cinematic depth of field',
  ];

  @override
  void dispose() {
    _promptController.dispose();
    super.dispose();
  }

  void _enhancePrompt() {
    final text = _promptController.text.trim();
    if (text.isEmpty) return;
    final randomEnhancement =
        _promptEnhancements[DateTime.now().microsecond % _promptEnhancements.length];
    _promptController.text = '$text, $randomEnhancement';
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ImageStudioController>(
      builder: (controller) {
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
            border: Border.all(
              color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Model Selector
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.memory_rounded, size: 18, color: AppColors.gradientStart),
                      const SizedBox(width: 8),
                      Text(
                        'AI MODEL',
                        style: robotoBold.copyWith(
                          fontSize: Dimensions.fontSizeExtraSmall,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ],
                  ),
                  if (controller.models.isNotEmpty)
                    DropdownButton<ImageModelDefinition>(
                      value: controller.selectedModel,
                      dropdownColor: Theme.of(context).cardColor,
                      underline: const SizedBox(),
                      icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
                      items: controller.models.map((model) {
                        return DropdownMenuItem<ImageModelDefinition>(
                          value: model,
                          child: Text(
                            '${model.name} (${model.creditCost} cr)',
                            style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall),
                          ),
                        );
                      }).toList(),
                      onChanged: controller.isGenerating
                          ? null
                          : (val) {
                              if (val != null) controller.selectModel(val);
                            },
                    ),
                ],
              ),
              const SizedBox(height: 12),

              // Aspect Ratio Selector
              Row(
                children: [
                  Text(
                    'Aspect Ratio: ',
                    style: robotoMedium.copyWith(
                      fontSize: Dimensions.fontSizeSmall,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 8),
                  ...['1:1', '16:9', '9:16'].map((ratio) {
                    final isSelected = controller.selectedAspectRatio == ratio;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: InkWell(
                        onTap: controller.isGenerating
                            ? null
                            : () => controller.setAspectRatio(ratio),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.gradientStart
                                : Theme.of(context).colorScheme.surface,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected
                                  ? AppColors.gradientStart
                                  : Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Text(
                            ratio,
                            style: robotoMedium.copyWith(
                              fontSize: Dimensions.fontSizeExtraSmall,
                              color: isSelected ? Colors.white : null,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
              const SizedBox(height: 14),

              // Prompt Input Field
              Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5),
                  ),
                ),
                child: Column(
                  children: [
                    TextField(
                      controller: _promptController,
                      maxLines: 3,
                      enabled: !controller.isGenerating,
                      style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeDefault),
                      decoration: InputDecoration(
                        hintText: 'Describe what you want to create...',
                        hintStyle: robotoRegular.copyWith(
                          fontSize: Dimensions.fontSizeSmall,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                        contentPadding: const EdgeInsets.all(12),
                        border: InputBorder.none,
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          InkWell(
                            onTap: _promptController.text.trim().isNotEmpty &&
                                    !controller.isGenerating
                                ? _enhancePrompt
                                : null,
                            borderRadius: BorderRadius.circular(6),
                            child: Padding(
                              padding: const EdgeInsets.all(4),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.auto_awesome_rounded,
                                    size: 14,
                                    color: _promptController.text.trim().isNotEmpty
                                        ? AppColors.gradientStart
                                        : Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant
                                            .withValues(alpha: 0.5),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Enhance Prompt',
                                    style: robotoMedium.copyWith(
                                      fontSize: Dimensions.fontSizeExtraSmall,
                                      color: _promptController.text.trim().isNotEmpty
                                        ? AppColors.gradientStart
                                        : Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant
                                            .withValues(alpha: 0.5),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          if (_promptController.text.isNotEmpty)
                            InkWell(
                              onTap: () {
                                _promptController.clear();
                                setState(() {});
                              },
                              child: const Icon(Icons.close_rounded, size: 16),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Starter Inspiration Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _inspirationChips.map((chip) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: InkWell(
                        onTap: controller.isGenerating
                            ? null
                            : () {
                                _promptController.text = chip;
                                setState(() {});
                              },
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surface,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Theme.of(context)
                                  .colorScheme
                                  .outline
                                  .withValues(alpha: 0.3),
                            ),
                          ),
                          child: Text(
                            chip,
                            style: robotoRegular.copyWith(
                              fontSize: Dimensions.fontSizeExtraSmall,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 16),

              // Generate Button
              CustomGradientButton(
                text: controller.isGenerating
                    ? 'Creating Image...'
                    : 'Generate Image (${controller.selectedModel.creditCost} credits)',
                isLoading: controller.isGenerating,
                onTap: () {
                  controller.generateImage(_promptController.text);
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ActiveImageSection extends StatelessWidget {
  const _ActiveImageSection();

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ImageStudioController>(
      builder: (controller) {
        final active = controller.activeImage;
        if (active == null) return const SizedBox();

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
            border: Border.all(
              color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'LATEST GENERATION',
                style: robotoBold.copyWith(
                  fontSize: Dimensions.fontSizeExtraSmall,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                active.prompt,
                style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),

              // Image Display
              ClipRRect(
                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                child: AspectRatio(
                  aspectRatio: 1.0,
                  child: CachedNetworkImage(
                    imageUrl: active.imageUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(
                      color: Theme.of(context).colorScheme.surface,
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (_, __, ___) => Container(
                      color: Theme.of(context).colorScheme.surface,
                      child: const Center(child: Icon(Icons.broken_image_rounded, size: 40)),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Open in Editor Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Get.toNamed(
                      RouteHelper.getEditorRoute(
                        imagePath: active.imageUrl,
                        projectName: active.name,
                        projectId: active.id,
                      ),
                    );
                  },
                  icon: const Icon(Icons.brush_rounded, size: 18),
                  label: const Text('Open in Canvas Editor'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gradientStart,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ImageGallerySection extends StatelessWidget {
  const _ImageGallerySection();

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ImageStudioController>(
      builder: (controller) {
        if (controller.gallery.isEmpty) return const SizedBox();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Recent Creations (${controller.gallery.length})',
              style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.85,
              ),
              itemCount: controller.gallery.length,
              itemBuilder: (context, index) {
                final item = controller.gallery[index];
                return InkWell(
                  onTap: () => controller.setActiveImage(item),
                  borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                      border: Border.all(
                        color: controller.activeImage?.id == item.id
                            ? AppColors.gradientStart
                            : Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                        width: controller.activeImage?.id == item.id ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(Dimensions.radiusDefault - 1),
                            ),
                            child: CachedNetworkImage(
                              imageUrl: item.imageUrl,
                              width: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.prompt,
                                style: robotoMedium.copyWith(
                                  fontSize: Dimensions.fontSizeExtraSmall,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                item.modelLabel,
                                style: robotoRegular.copyWith(
                                  fontSize: 10,
                                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }
}
