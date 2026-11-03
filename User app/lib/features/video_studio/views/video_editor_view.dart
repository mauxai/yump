import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_appbar_widget.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/features/video_studio/widgets/video_export_bottom_sheet.dart';
import 'package:lumen/features/video_studio/widgets/video_inline_preview_widget.dart';
import 'package:lumen/features/video_studio/widgets/video_multitrack_timeline_widget.dart';
import 'package:lumen/features/video_studio/widgets/video_player_widget.dart';
import 'package:lumen/features/video_studio/widgets/video_text_overlay_dialog.dart';
import 'package:lumen/features/video_studio/widgets/video_watermark_dialog.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoEditorView extends StatefulWidget {
  final String? initialVideoUrl;

  const VideoEditorView({super.key, this.initialVideoUrl});

  @override
  State<VideoEditorView> createState() => _VideoEditorViewState();
}

class _VideoEditorViewState extends State<VideoEditorView> with SingleTickerProviderStateMixin {
  late final VideoEditorController _ctrl;
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _ctrl = Get.find<VideoEditorController>();
    _ctrl.init(initialVideoUrl: widget.initialVideoUrl);
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showEditTitleDialog() {
    final titleController = TextEditingController(text: _ctrl.title);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('edit_title_hint'.tr, style: robotoBold),
        content: TextField(
          controller: titleController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'video_title'.tr,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('cancel'.tr),
          ),
          ElevatedButton(
            onPressed: () {
              if (titleController.text.trim().isNotEmpty) {
                _ctrl.setTitle(titleController.text.trim());
              }
              Navigator.pop(context);
            },
            child: Text('save'.tr),
          ),
        ],
      ),
    );
  }

  Future<void> _pickAudioFile() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.audio);
    if (result != null && result.files.single.path != null) {
      final uploadedUrl = await _ctrl.uploadMediaFile(result.files.single.path!, isAudio: true);
      if (uploadedUrl != null) {
        _ctrl.setSoundtrack(uploadedUrl);
      }
    }
  }

  Future<bool> _confirmExit() async {
    if (_ctrl.clips.isEmpty) return true;
    if (!mounted) return true;
    final res = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('exit'.tr, style: robotoBold),
        content: Text('discard_edit_confirm'.tr, style: robotoRegular),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text('cancel'.tr)),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: Text('exit'.tr),
          ),
        ],
      ),
    );
    return res ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final shouldExit = await _confirmExit();
        if (shouldExit && context.mounted) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: CustomAppBar(
          title: 'video_editor'.tr,
          showBackButton: true,
          onBackPressed: () async {
            final shouldExit = await _confirmExit();
            if (shouldExit && context.mounted) {
              Navigator.pop(context);
            }
          },
        ),
        body: GetBuilder<VideoEditorController>(
          builder: (ctrl) {
            return Column(
              children: [
                // Top Info Bar: Title & Aspect Ratio
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: _showEditTitleDialog,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Flexible(
                                child: Text(
                                  ctrl.title,
                                  style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Icon(Icons.edit_outlined, size: 14, color: AppColors.gradientStart),
                            ],
                          ),
                        ),
                      ),
                      // Aspect Ratio Toggle
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: AppConstants.videoAspectRatios.map((ratio) {
                            final isSelected = ctrl.selectedAspectRatio == ratio;
                            return Padding(
                              padding: const EdgeInsets.only(left: 4),
                              child: ChoiceChip(
                                label: Text(ratio, style: robotoMedium.copyWith(fontSize: 10)),
                                selected: isSelected,
                                selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                visualDensity: VisualDensity.compact,
                                onSelected: (_) => ctrl.setAspectRatio(ratio),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ),

                // Live Inline Video Preview Section
                const VideoEditorInlinePreviewWidget(),
                const SizedBox(height: 8),

                // Tab Bar (5 Tabs)
                TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  labelColor: AppColors.gradientStart,
                  unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
                  indicatorColor: AppColors.gradientStart,
                  tabs: [
                    Tab(text: 'timeline'.tr),
                    Tab(text: 'soundtrack'.tr),
                    Tab(text: 'text_overlays'.tr),
                    Tab(text: 'watermark_branding'.tr),
                    Tab(text: 'video_edits_history'.tr),
                  ],
                ),

                // Tab Views
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildTimelineTab(ctrl),
                      _buildSoundtrackTab(ctrl),
                      _buildTextOverlaysTab(ctrl),
                      _buildWatermarkTab(ctrl),
                      _buildHistoryTab(ctrl),
                    ],
                  ),
                ),

                // Bottom Render Action Bar
                _buildBottomRenderBar(ctrl),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildTimelineTab(VideoEditorController ctrl) {
    return const SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          VideoMultiTrackTimelineWidget(),
        ],
      ),
    );
  }

  Widget _buildSoundtrackTab(VideoEditorController ctrl) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('soundtrack'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
          const SizedBox(height: 12),
          if (ctrl.soundtrackUrl.isEmpty) ...[
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
              ),
              onPressed: _pickAudioFile,
              icon: const Icon(Icons.library_music_rounded, color: AppColors.gradientStart),
              label: Text('pick_audio_file'.tr, style: robotoMedium),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                border: Border.all(color: Theme.of(context).colorScheme.outline),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          ctrl.soundtrackUrl.split('/').last,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: robotoMedium,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                        onPressed: ctrl.removeSoundtrack,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Soundtrack Volume Slider
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'soundtrack_volume'.trParams({'volume': '${(ctrl.soundtrackVolume * 100).round()}'}),
                        style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                      ),
                    ],
                  ),
                  Slider(
                    value: ctrl.soundtrackVolume,
                    min: 0.0,
                    max: 1.0,
                    divisions: 10,
                    activeColor: AppColors.gradientStart,
                    onChanged: (val) => ctrl.setSoundtrack(
                      ctrl.soundtrackUrl,
                      volume: val,
                      startOffset: ctrl.soundtrackStartOffset,
                      fade: ctrl.soundtrackFade,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Soundtrack Start Offset Slider
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('soundtrack_start_offset'.trParams({'seconds': '${ctrl.soundtrackStartOffset}'}), style: robotoMedium),
                    ],
                  ),
                  Slider(
                    value: ctrl.soundtrackStartOffset.toDouble(),
                    min: 0,
                    max: 30,
                    divisions: 30,
                    activeColor: AppColors.gradientEnd,
                    onChanged: (val) => ctrl.setSoundtrack(
                      ctrl.soundtrackUrl,
                      volume: ctrl.soundtrackVolume,
                      startOffset: val.round(),
                      fade: ctrl.soundtrackFade,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Audio Fade In / Out
                  Text('audio_fade'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children: AppConstants.videoAudioFadeEffects.map((fade) {
                      final isSel = ctrl.soundtrackFade == fade['value'];
                      return ChoiceChip(
                        label: Text(fade['label']!.tr, style: robotoRegular.copyWith(fontSize: 11)),
                        selected: isSel,
                        selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                        onSelected: (_) => ctrl.setSoundtrack(
                          ctrl.soundtrackUrl,
                          volume: ctrl.soundtrackVolume,
                          startOffset: ctrl.soundtrackStartOffset,
                          fade: fade['value']!,
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTextOverlaysTab(VideoEditorController ctrl) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('text_overlays'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
              TextButton.icon(
                onPressed: () => VideoTextOverlayDialog.show(context),
                icon: const Icon(Icons.add, size: 16),
                label: Text('add_text'.tr, style: robotoMedium),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (ctrl.textOverlays.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'no_text_overlays'.tr,
                  style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: ctrl.textOverlays.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final overlay = ctrl.textOverlays[i];
                return ListTile(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                  tileColor: Theme.of(context).cardColor,
                  leading: const Icon(Icons.subtitles_rounded, color: AppColors.gradientStart),
                  title: Text(overlay.text, style: robotoMedium),
                  subtitle: Text(
                    '${overlay.position} • ${overlay.size} • ${overlay.length}s',
                    style: robotoRegular.copyWith(fontSize: 12),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                    onPressed: () => ctrl.removeTextOverlay(i),
                  ),
                  onTap: () => VideoTextOverlayDialog.show(context, overlayIndex: i, overlay: overlay),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildWatermarkTab(VideoEditorController ctrl) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('watermark_branding'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault)),
              if (ctrl.watermark != null)
                TextButton(
                  onPressed: () => VideoWatermarkDialog.show(context),
                  child: Text('edit'.tr, style: robotoMedium.copyWith(color: AppColors.gradientStart)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (ctrl.watermark == null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                border: Border.all(color: Theme.of(context).colorScheme.outline),
              ),
              child: Column(
                children: [
                  Icon(Icons.branding_watermark_outlined, size: 36, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  const SizedBox(height: 8),
                  Text(
                    'watermark_logo'.tr,
                    style: robotoMedium.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gradientStart,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    onPressed: () => VideoWatermarkDialog.show(context),
                    icon: const Icon(Icons.upload_file_rounded, size: 18),
                    label: Text('upload_logo'.tr),
                  ),
                ],
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
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
                    child: Image.network(ctrl.watermark!.url, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.image)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('watermark_logo'.tr, style: robotoMedium),
                        const SizedBox(height: 4),
                        Text(
                          '${ctrl.watermark!.position} • ${((ctrl.watermark!.opacity) * 100).round()}% opacity',
                          style: robotoRegular.copyWith(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                    onPressed: ctrl.removeWatermark,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHistoryTab(VideoEditorController ctrl) {
    if (ctrl.isLoadingHistory) {
      return const Center(child: CircularProgressIndicator());
    }

    if (ctrl.editHistory.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'no_edits_yet'.tr,
            style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: ctrl.editHistory.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final item = ctrl.editHistory[i];
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
            border: Border.all(color: Theme.of(context).colorScheme.outline),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      item.title,
                      style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                    onPressed: () => ctrl.deleteEdit(item.id),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${item.aspectRatio} • ${item.resolution} • ${item.status}',
                style: robotoRegular.copyWith(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 8),
              if (item.isProcessing)
                Row(
                  children: [
                    const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                    const SizedBox(width: 8),
                    Text('rendering_video'.tr, style: robotoRegular.copyWith(fontSize: 12)),
                  ],
                )
              else if (item.isCompleted && item.videoUrl != null)
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gradientStart,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (_) => VideoPlayerWidget(url: item.videoUrl, title: item.title),
                    );
                  },
                  icon: const Icon(Icons.play_arrow_rounded, size: 18),
                  label: Text('play_video'.tr),
                )
              else if (item.isFailed)
                Text(
                  '${'failed'.tr}: ${item.errorMessage ?? 'error_occurred'.tr}',
                  style: robotoRegular.copyWith(fontSize: 12, color: Colors.redAccent),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBottomRenderBar(VideoEditorController ctrl) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: CustomGradientButton(
          text: ctrl.isRendering ? 'rendering_video'.tr : 'export_and_render'.tr,
          isLoading: ctrl.isRendering,
          onTap: ctrl.isRendering ? () {} : () => VideoExportBottomSheet.show(context),
        ),
      ),
    );
  }
}
