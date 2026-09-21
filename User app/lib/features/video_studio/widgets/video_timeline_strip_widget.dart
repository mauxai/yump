import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/features/video_studio/widgets/add_clip_bottom_sheet.dart';
import 'package:lumen/features/video_studio/widgets/video_clip_editor_dialog.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoTimelineStripWidget extends StatelessWidget {
  const VideoTimelineStripWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoEditorController>(
      builder: (ctrl) {
        final clips = ctrl.clips;

        if (clips.isEmpty) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
              border: Border.all(color: Theme.of(context).colorScheme.outline),
            ),
            child: Column(
              children: [
                Icon(Icons.video_library_outlined, size: 36, color: Theme.of(context).colorScheme.onSurfaceVariant),
                const SizedBox(height: 8),
                Text(
                  'no_clips_added'.tr,
                  textAlign: TextAlign.center,
                  style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gradientStart,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  onPressed: () => AddClipBottomSheet.show(context),
                  icon: const Icon(Icons.add, size: 18),
                  label: Text('add_clip'.tr),
                ),
              ],
            ),
          );
        }

        return SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: clips.length + 1,
            itemBuilder: (context, i) {
              if (i == clips.length) {
                // Add Clip button card
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: InkWell(
                      onTap: () => AddClipBottomSheet.show(context),
                      borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                      child: Container(
                        width: 70,
                        height: 100,
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                          border: Border.all(
                            color: AppColors.gradientStart.withValues(alpha: 0.5),
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.add_circle_outline, color: AppColors.gradientStart, size: 24),
                            const SizedBox(height: 4),
                            Text(
                              'add_clip'.tr,
                              textAlign: TextAlign.center,
                              style: robotoMedium.copyWith(fontSize: 10, color: AppColors.gradientStart),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }

              final clip = clips[i];
              final isSelected = ctrl.selectedClipIndex == i;

              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: () => ctrl.selectClip(i),
                    child: Container(
                      width: 90,
                      height: 100,
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                        border: Border.all(
                          color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.outline,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.gradientStart.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  '#${i + 1}',
                                  style: robotoBold.copyWith(fontSize: 10, color: AppColors.gradientStart),
                                ),
                              ),
                              GestureDetector(
                                onTap: () => VideoClipEditorDialog.show(context, i, clip),
                                child: const Icon(Icons.tune_rounded, size: 16, color: AppColors.gradientStart),
                              ),
                            ],
                          ),
                          Center(
                            child: Icon(
                              Icons.movie_filter_outlined,
                              size: 26,
                              color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${clip.length}s',
                                style: robotoMedium.copyWith(fontSize: 11),
                              ),
                              if (clip.filter != null && clip.filter!.isNotEmpty)
                                const Icon(Icons.auto_awesome, size: 12, color: Colors.amber),
                              if (i > 0)
                                GestureDetector(
                                  onTap: () => ctrl.reorderClips(i, i - 1),
                                  child: const Icon(Icons.arrow_back_ios_rounded, size: 10),
                                ),
                              if (i < clips.length - 1)
                                GestureDetector(
                                  onTap: () => ctrl.reorderClips(i, i + 2),
                                  child: const Icon(Icons.arrow_forward_ios_rounded, size: 10),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Transition Indicator between clips
                  if (i < clips.length - 1)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: GestureDetector(
                        onTap: () => VideoClipEditorDialog.show(context, i + 1, clips[i + 1]),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(
                            color: Theme.of(context).scaffoldBackgroundColor,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Theme.of(context).colorScheme.outline),
                          ),
                          child: Icon(
                            clips[i + 1].transitionIn != null ? Icons.swap_horiz_rounded : Icons.link,
                            size: 14,
                            color: AppColors.gradientStart,
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        );
      },
    );
  }
}
