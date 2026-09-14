import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/home/controllers/home_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class HomeCreateProjectSheet extends StatefulWidget {
  final String imagePath;
  final String? initialPrompt;

  const HomeCreateProjectSheet({super.key, required this.imagePath, this.initialPrompt});

  @override
  State<HomeCreateProjectSheet> createState() => _HomeCreateProjectSheetState();
}

class _HomeCreateProjectSheetState extends State<HomeCreateProjectSheet> {
  final TextEditingController _nameCtrl = TextEditingController();
  double? _imageAspectRatio;

  @override
  void initState() {
    super.initState();
    _resolveImageSize();
  }

  void _resolveImageSize() {
    final ImageStream stream = Image.file(File(widget.imagePath)).image.resolve(const ImageConfiguration());
    late final ImageStreamListener listener;
    listener = ImageStreamListener((ImageInfo info, bool _) {
      if (!mounted) return;
      setState(() {
        _imageAspectRatio = info.image.width / info.image.height;
      });
      stream.removeListener(listener);
    }, onError: (_, __) {
      stream.removeListener(listener);
    });
    stream.addListener(listener);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(Dimensions.radiusExtraLarge)),
      ),
      padding: const EdgeInsets.only(
        left: Dimensions.paddingSizeLarge,
        right: Dimensions.paddingSizeLarge,
        top: Dimensions.paddingSizeDefault,
        bottom: Dimensions.paddingSizeLarge,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colorScheme.outline,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          const SizedBox(height: Dimensions.paddingSizeLarge),

          Flexible(child: SingleChildScrollView(child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
          Text(
            'create_project'.tr,
            style: robotoBold.copyWith(
              color: colorScheme.onSurface,
              fontSize: Dimensions.fontSizeOverLarge,
            ),
          ),

          const SizedBox(height: 4),

          Text(
            'create_project_subtitle'.tr,
            style: robotoRegular.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontSize: Dimensions.fontSizeDefault,
            ),
          ),

          const SizedBox(height: Dimensions.paddingSizeLarge),

          LayoutBuilder(builder: (context, constraints) {
            final double maxHeight = MediaQuery.of(context).size.height * 0.25;
            final double maxWidth = constraints.maxWidth * 0.7;
            double width = maxWidth;
            double height = maxHeight;

            if (_imageAspectRatio != null) {
              final double ratio = _imageAspectRatio!;
              height = width / ratio;
              if (height > maxHeight) {
                height = maxHeight;
                width = height * ratio;
              }
            }

            return ClipRRect(
              borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
              child: Image.file(
                File(widget.imagePath),
                width: width,
                height: height,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => Container(
                  height: 200,
                  width: double.infinity,
                  color: colorScheme.surface,
                  child: Icon(Icons.broken_image_outlined, color: colorScheme.onSurfaceVariant, size: 48),
                ),
              ),
            );
          }),

          if (widget.initialPrompt != null) ...[
            const SizedBox(height: Dimensions.paddingSizeLarge),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                horizontal: Dimensions.paddingSizeDefault,
                vertical: Dimensions.paddingSizeSmall,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.gradientStart.withValues(alpha: 0.12),
                    AppColors.gradientEnd.withValues(alpha: 0.12),
                  ],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 1),
                border: Border.all(color: AppColors.gradientStart.withValues(alpha: 0.4)),
              ),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                ShaderMask(
                  blendMode: BlendMode.srcIn,
                  shaderCallback: (bounds) => AppColors.mainGradient.createShader(bounds),
                  child: const Icon(Icons.auto_awesome_rounded, size: 16),
                ),

                const SizedBox(width: Dimensions.paddingSizeEight),

                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(
                      'prompt_label'.tr,
                      style: robotoMedium.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        foreground: Paint()
                          ..shader = AppColors.mainGradient.createShader(
                            const Rect.fromLTWH(0, 0, 100, 14),
                          ),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.initialPrompt!,
                      style: robotoRegular.copyWith(
                        color: colorScheme.onSurface,
                        fontSize: Dimensions.fontSizeDefault,
                      ),
                    ),
                  ]),
                ),
              ]),
            ),
          ],
            ],
          ))),

          const SizedBox(height: Dimensions.paddingSizeLarge),

          Container(
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 1),
              border: Border.all(color: colorScheme.outline),
            ),
            child: TextField(
              controller: _nameCtrl,
              textInputAction: TextInputAction.done,
              style: robotoRegular.copyWith(
                color: colorScheme.onSurface,
                fontSize: Dimensions.fontSizeDefault,
              ),
              decoration: InputDecoration(
                hintText: 'project_name_hint'.tr,
                hintStyle: robotoRegular.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  fontSize: Dimensions.fontSizeDefault,
                ),
                prefixIcon: Icon(
                  Icons.edit_note_rounded,
                  color: colorScheme.onSurfaceVariant,
                  size: Dimensions.paddingSizeLarge,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeLarge),
              ),
            ),
          ),

          const SizedBox(height: Dimensions.paddingSizeLarge),

          GetBuilder<HomeController>(id: 'create_project', builder: (c) {
            return CustomGradientButton(
              text: 'create_project'.tr,
              isLoading: c.isCreatingProject,
              onTap: () {
                final rawName = _nameCtrl.text.trim();
                final name = rawName.isEmpty || rawName == '.' ? 'untitled_project'.tr : rawName;
                c.createProject(name, widget.imagePath, initialPrompt: widget.initialPrompt);
              },
            );
          }),
        ],
      ),
    );
  }
}
