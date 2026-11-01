import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_appbar_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/features/video_studio/models/video_editor_models.dart';
import 'package:lumen/features/video_studio/widgets/video_player_widget.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoRenderSuccessView extends StatelessWidget {
  final String? editId;

  const VideoRenderSuccessView({super.key, this.editId});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoEditorController>(
      builder: (ctrl) {
        VideoEditRecordModel? record;
        if (editId != null && editId!.isNotEmpty) {
          record = ctrl.editHistory.firstWhereOrNull((e) => e.id == editId);
        }
        record ??= ctrl.activeEdit;

        final videoUrl = record?.videoUrl;
        final title = record?.title ?? ctrl.title;

        return Scaffold(
          backgroundColor: Theme.of(context).scaffoldBackgroundColor,
          appBar: CustomAppBar(
            title: 'render_success_title'.tr,
            showBackButton: true,
            onBackPressed: () => Get.offAllNamed(RouteHelper.getDashboardRoute()),
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Success celebratory icon & text
                  Center(
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.green.shade600, width: 2),
                      ),
                      child: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 38),
                    ),
                  ),
                  const SizedBox(height: 14),

                  Text(
                    'render_success_title'.tr,
                    style: robotoBold.copyWith(fontSize: Dimensions.fontSizeExtraLarge),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'render_success_desc'.tr,
                    style: robotoRegular.copyWith(
                      fontSize: Dimensions.fontSizeSmall,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),

                  // Embedded Video Player Section
                  if (videoUrl != null && videoUrl.isNotEmpty)
                    Container(
                      height: 260,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: VideoPlayerWidget(
                        url: videoUrl,
                        title: title,
                      ),
                    )
                  else
                    Container(
                      height: 200,
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                      ),
                      alignment: Alignment.center,
                      child: const CircularProgressIndicator(),
                    ),
                  const SizedBox(height: 16),

                  // Metadata Badges Row
                  if (record != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                        border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildMetaChip(context, Icons.aspect_ratio_rounded, record.aspectRatio),
                          _buildMetaChip(context, Icons.hd_outlined, record.resolution.toUpperCase()),
                          if (record.duration != null)
                            _buildMetaChip(context, Icons.timer_outlined, '${record.duration!.round()}s'),
                          _buildMetaChip(context, Icons.stars_rounded, '${record.creditCost} Credits', color: Colors.amber),
                        ],
                      ),
                    ),
                  const SizedBox(height: 24),

                  // Primary Actions
                  // 1. Download to Gallery
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.gradientStart,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                      ),
                      onPressed: (videoUrl == null || ctrl.isDownloading)
                          ? null
                          : () => ctrl.downloadRenderedVideo(videoUrl),
                      icon: ctrl.isDownloading
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.download_rounded, size: 20),
                      label: Text(
                        ctrl.isDownloading ? 'downloading_video'.tr : 'download_video'.tr,
                        style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 2. Share Video via Native OS Sheet
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                        side: const BorderSide(color: AppColors.gradientStart),
                      ),
                      onPressed: (videoUrl == null || ctrl.isSharing)
                          ? null
                          : () => ctrl.shareRenderedVideo(videoUrl, title),
                      icon: ctrl.isSharing
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.share_rounded, size: 20, color: AppColors.gradientStart),
                      label: Text(
                        'share_video'.tr,
                        style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault, color: AppColors.gradientStart),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 3. Edit Again (Restores project timeline)
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                      ),
                      onPressed: record == null ? null : () => ctrl.restoreProjectForEditing(record!),
                      icon: const Icon(Icons.auto_fix_high_rounded, size: 20),
                      label: Text(
                        'edit_again'.tr,
                        style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 4. Done & Return to Studio
                  TextButton(
                    onPressed: () => Get.offAllNamed(RouteHelper.getVideoStudioRoute()),
                    child: Text(
                      'done_to_studio'.tr,
                      style: robotoMedium.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontSize: Dimensions.fontSizeSmall,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildMetaChip(BuildContext context, IconData icon, String label, {Color? color}) {
    final activeColor = color ?? Theme.of(context).colorScheme.onSurface;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: activeColor),
        const SizedBox(width: 4),
        Text(
          label,
          style: robotoMedium.copyWith(fontSize: 11, color: activeColor),
        ),
      ],
    );
  }
}
