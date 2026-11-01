import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_appbar_widget.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoRenderProgressView extends StatefulWidget {
  final String? editId;

  const VideoRenderProgressView({super.key, this.editId});

  @override
  State<VideoRenderProgressView> createState() => _VideoRenderProgressViewState();
}

class _VideoRenderProgressViewState extends State<VideoRenderProgressView> with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoEditorController>(
      builder: (ctrl) {
        final activeEdit = ctrl.activeEdit;
        final currentStage = ctrl.activeRenderStage;
        final title = activeEdit?.title ?? ctrl.title;
        final res = activeEdit?.resolution ?? ctrl.selectedResolution;
        final aspect = activeEdit?.aspectRatio ?? ctrl.selectedAspectRatio;

        return Scaffold(
          backgroundColor: Theme.of(context).scaffoldBackgroundColor,
          appBar: CustomAppBar(
            title: 'video_rendering_title'.tr,
            showBackButton: true,
            onBackPressed: () {
              Get.back();
            },
          ),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 20),

                          // Animated Glowing Cloud Render Pulse
                          Center(
                            child: SizedBox(
                              width: 140,
                              height: 140,
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  AnimatedBuilder(
                                    animation: _animController,
                                    builder: (_, __) {
                                      return Container(
                                        width: 110 + (20 * _animController.value),
                                        height: 110 + (20 * _animController.value),
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          gradient: RadialGradient(
                                            colors: [
                                              AppColors.gradientStart.withValues(alpha: 0.3 * (1 - _animController.value)),
                                              Colors.transparent,
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                  Container(
                                    width: 90,
                                    height: 90,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: const LinearGradient(
                                        colors: [AppColors.gradientStart, AppColors.gradientEnd],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.gradientStart.withValues(alpha: 0.4),
                                          blurRadius: 15,
                                          offset: const Offset(0, 5),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(
                                      Icons.cloud_upload_rounded,
                                      size: 42,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Header Text
                          Text(
                            'rendering_in_cloud'.tr,
                            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeExtraLarge),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'rendering_desc'.tr,
                              style: robotoRegular.copyWith(
                                fontSize: Dimensions.fontSizeSmall,
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Project Metadata Card
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Theme.of(context).cardColor,
                              borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                              border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: AppColors.gradientStart.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(Icons.movie_creation_outlined, color: AppColors.gradientStart),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        title,
                                        style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '$aspect • ${res.toUpperCase()} • ${ctrl.clips.length} ${'clips'.tr}',
                                        style: robotoRegular.copyWith(
                                          fontSize: 12,
                                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // 4-Stage Stepper
                          _buildStageStep(
                            context,
                            stepNumber: 1,
                            title: 'stage_queueing'.tr,
                            currentStage: currentStage,
                          ),
                          _buildStageConnector(1, currentStage),
                          _buildStageStep(
                            context,
                            stepNumber: 2,
                            title: 'stage_fetching'.tr,
                            currentStage: currentStage,
                          ),
                          _buildStageConnector(2, currentStage),
                          _buildStageStep(
                            context,
                            stepNumber: 3,
                            title: 'stage_stitching'.tr,
                            currentStage: currentStage,
                          ),
                          _buildStageConnector(3, currentStage),
                          _buildStageStep(
                            context,
                            stepNumber: 4,
                            title: 'stage_encoding'.tr,
                            currentStage: currentStage,
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Bottom Action: Continue in Background
                  const SizedBox(height: 12),
                  CustomGradientButton(
                    text: 'continue_in_background'.tr,
                    onTap: () {
                      Get.offAllNamed(RouteHelper.getDashboardRoute());
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildStageStep(
    BuildContext context, {
    required int stepNumber,
    required String title,
    required int currentStage,
  }) {
    final bool isDone = currentStage > stepNumber;
    final bool isActive = currentStage == stepNumber;

    Color iconBg = Theme.of(context).cardColor;
    Color iconColor = Theme.of(context).colorScheme.onSurfaceVariant;
    Color textColor = Theme.of(context).colorScheme.onSurfaceVariant;

    if (isDone) {
      iconBg = Colors.green.shade600;
      iconColor = Colors.white;
      textColor = Theme.of(context).colorScheme.onSurface;
    } else if (isActive) {
      iconBg = AppColors.gradientStart;
      iconColor = Colors.white;
      textColor = AppColors.gradientStart;
    }

    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: iconBg,
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive ? AppColors.gradientStart : (isDone ? Colors.green : Theme.of(context).colorScheme.outline),
              width: 1.5,
            ),
          ),
          alignment: Alignment.center,
          child: isDone
              ? const Icon(Icons.check, size: 16, color: Colors.white)
              : (isActive
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      '$stepNumber',
                      style: robotoMedium.copyWith(fontSize: 12, color: iconColor),
                    )),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            title,
            style: isActive ? robotoBold.copyWith(fontSize: 13, color: textColor) : robotoRegular.copyWith(fontSize: 13, color: textColor),
          ),
        ),
      ],
    );
  }

  Widget _buildStageConnector(int stepNumber, int currentStage) {
    final bool isDone = currentStage > stepNumber;
    return Container(
      margin: const EdgeInsets.only(left: 13),
      width: 2,
      height: 22,
      color: isDone ? Colors.green : Colors.grey.withValues(alpha: 0.3),
    );
  }
}
