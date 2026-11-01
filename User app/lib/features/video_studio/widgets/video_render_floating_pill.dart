import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/styles.dart';

class VideoRenderFloatingPill extends StatelessWidget {
  const VideoRenderFloatingPill({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoEditorController>(
      builder: (ctrl) {
        if (!ctrl.isRendering) return const SizedBox.shrink();

        final currentRoute = Get.currentRoute;
        if (currentRoute.contains(RouteHelper.videoRenderProgress) ||
            currentRoute.contains(RouteHelper.videoRenderSuccess)) {
          return const SizedBox.shrink();
        }

        final title = ctrl.activeEdit?.title ?? ctrl.title;

        return Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          left: 16,
          right: 16,
          child: GestureDetector(
            onTap: () {
              if (ctrl.activeEdit != null) {
                Get.toNamed(RouteHelper.getVideoRenderProgressRoute(ctrl.activeEdit!.id));
              }
            },
            child: Material(
              elevation: 6,
              borderRadius: BorderRadius.circular(30),
              color: Colors.transparent,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                  ),
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.gradientStart.withValues(alpha: 0.35),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '${'render_running_background'.tr} ($title)',
                        style: robotoMedium.copyWith(color: Colors.white, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 12),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
