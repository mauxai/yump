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

        final selectedIndex = ctrl.selectedClipIndex;
        final hasValidSelection = selectedIndex >= 0 && selectedIndex < clips.length;
        final selectedClip = hasValidSelection ? clips[selectedIndex] : null;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // CapCut-style Multi-Tool Quick Action Bar
            if (hasValidSelection && selectedClip != null)
              Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    // Split Button (Scissors)
                    _buildActionButton(
                      context,
                      icon: Icons.content_cut_rounded,
                      label: 'split_clip'.tr,
                      onTap: () {
                        final atSeconds = ctrl.currentPosition.inSeconds.toDouble();
                        ctrl.splitClip(selectedIndex, atSeconds > 0 ? atSeconds : 2.0);
                      },
                    ),

                    // Duplicate Button
                    _buildActionButton(
                      context,
                      icon: Icons.copy_rounded,
                      label: 'duplicate_clip'.tr,
                      onTap: () => ctrl.duplicateClip(selectedIndex),
                    ),

                    // Edit Clip Sheet Button
                    _buildActionButton(
                      context,
                      icon: Icons.tune_rounded,
                      label: 'edit_clip'.tr,
                      onTap: () => VideoClipEditorDialog.show(context, selectedIndex, selectedClip),
                    ),

                    // Delete Clip Button
                    _buildActionButton(
                      context,
                      icon: Icons.delete_outline_rounded,
                      label: 'delete_clip'.tr,
                      color: Colors.redAccent,
                      onTap: () {
                        if (clips.length <= 1) {
                          ctrl.removeClip(selectedIndex);
                        } else {
                          showDialog(
                            context: context,
                            builder: (_) => AlertDialog(
                              title: Text('delete_clip'.tr, style: robotoBold),
                              content: Text('delete_edit_confirm'.tr, style: robotoRegular),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(context), child: Text('cancel'.tr)),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
                                  onPressed: () {
                                    Navigator.pop(context);
                                    ctrl.removeClip(selectedIndex);
                                  },
                                  child: Text('delete'.tr),
                                ),
                              ],
                            ),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),

            // Horizontal Timeline Strip
            SizedBox(
              height: 110,
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
                            height: 95,
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
                          width: 95,
                          height: 95,
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
                              // Top clip header: # index & duration
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isSelected ? AppColors.gradientStart : Colors.white10,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      '#${i + 1}',
                                      style: robotoBold.copyWith(
                                        fontSize: 9,
                                        color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    '${clip.length}s',
                                    style: robotoMedium.copyWith(fontSize: 10),
                                  ),
                                ],
                              ),

                              // Clip center icon/type
                              Center(
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    Icon(
                                      clip.isImage ? Icons.image_outlined : Icons.movie_filter_outlined,
                                      size: 26,
                                      color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                                    if (clip.speed != 1.0)
                                      Positioned(
                                        bottom: 0,
                                        right: 0,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.black87,
                                            borderRadius: BorderRadius.circular(3),
                                          ),
                                          child: Text(
                                            '${clip.speed}x',
                                            style: const TextStyle(color: Colors.amber, fontSize: 8, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),

                              // Bottom action / badges
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  if (clip.effect != null && clip.effect!.isNotEmpty)
                                    const Icon(Icons.motion_photos_on_rounded, size: 12, color: Colors.blueAccent)
                                  else if (clip.filter != null && clip.filter!.isNotEmpty)
                                    const Icon(Icons.auto_awesome, size: 12, color: Colors.amber)
                                  else
                                    const SizedBox(width: 12),
                                  Row(
                                    children: [
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
                            ],
                          ),
                        ),
                      ),

                      // Transition Badge between clips
                      if (i < clips.length - 1)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: GestureDetector(
                            onTap: () => VideoClipEditorDialog.show(context, i + 1, clips[i + 1]),
                            child: Container(
                              padding: const EdgeInsets.all(5),
                              decoration: BoxDecoration(
                                color: Theme.of(context).scaffoldBackgroundColor,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: clips[i + 1].transitionIn != null ? AppColors.gradientStart : Theme.of(context).colorScheme.outline,
                                ),
                              ),
                              child: Icon(
                                clips[i + 1].transitionIn != null ? Icons.bolt_rounded : Icons.add_rounded,
                                size: 12,
                                color: clips[i + 1].transitionIn != null ? AppColors.gradientStart : Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ),
                    ],
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildActionButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    final activeColor = color ?? Theme.of(context).colorScheme.onSurface;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: activeColor),
            const SizedBox(height: 2),
            Text(
              label,
              style: robotoMedium.copyWith(fontSize: 10, color: activeColor),
            ),
          ],
        ),
      ),
    );
  }
}
