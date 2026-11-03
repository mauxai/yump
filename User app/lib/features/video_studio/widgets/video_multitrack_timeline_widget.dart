import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/features/video_studio/models/video_editor_models.dart';
import 'package:lumen/features/video_studio/widgets/add_clip_bottom_sheet.dart';
import 'package:lumen/features/video_studio/widgets/video_clip_editor_dialog.dart';
import 'package:lumen/features/video_studio/widgets/video_text_overlay_dialog.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class VideoMultiTrackTimelineWidget extends StatefulWidget {
  const VideoMultiTrackTimelineWidget({super.key});

  @override
  State<VideoMultiTrackTimelineWidget> createState() => _VideoMultiTrackTimelineWidgetState();
}

class _VideoMultiTrackTimelineWidgetState extends State<VideoMultiTrackTimelineWidget> {
  final ScrollController _scrollController = ScrollController();
  double _baseZoom = 24.0;

  String _formatSeconds(double totalSecs) {
    final int minutes = (totalSecs / 60).floor();
    final double remSecs = totalSecs % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remSecs.toStringAsFixed(1).padLeft(4, '0')}';
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _autoScrollPlayhead(double playheadX) {
    if (!_scrollController.hasClients) return;
    final viewportWidth = _scrollController.position.viewportDimension;
    final target = (playheadX - viewportWidth / 2).clamp(0.0, _scrollController.position.maxScrollExtent);
    if ((_scrollController.offset - target).abs() > 25) {
      _scrollController.animateTo(
        target,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
      );
    }
  }

  void _confirmDeleteClip(BuildContext context, VideoEditorController ctrl, int index) {
    if (ctrl.clips.length <= 1) {
      ctrl.removeClip(index);
      return;
    }
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
              ctrl.removeClip(index);
            },
            child: Text('delete'.tr),
          ),
        ],
      ),
    );
  }

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

        final double zoom = ctrl.timelineZoom;
        final double totalDuration = ctrl.totalTimelineDuration > 0 ? ctrl.totalTimelineDuration : 10.0;
        final double timelineWidth = (totalDuration + 5) * zoom;
        final double playheadX = ctrl.globalPlayheadSeconds * zoom;

        // Auto-scroll follow playhead while playing
        if (ctrl.isPlaying) {
          WidgetsBinding.instance.addPostFrameCallback((_) => _autoScrollPlayhead(playheadX));
        }

        final hasValidSelection = ctrl.selectedClipIndex >= 0 && ctrl.selectedClipIndex < clips.length;
        final selectedClip = hasValidSelection ? clips[ctrl.selectedClipIndex] : null;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top CapCut-Grade Toolbar: Timecode, Undo, Redo, Scissors, Duplicate, Edit, Delete, Text, Add, Zoom
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.4)),
              ),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    // Global Playhead Timecode Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      margin: const EdgeInsets.only(right: 6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.timer_outlined, size: 14, color: AppColors.gradientStart),
                          const SizedBox(width: 4),
                          Text(
                            '${_formatSeconds(ctrl.globalPlayheadSeconds)} / ${_formatSeconds(totalDuration)}',
                            style: robotoBold.copyWith(fontSize: 11, color: AppColors.gradientStart),
                          ),
                        ],
                      ),
                    ),

                    // Undo Tool
                    _buildToolIconButton(
                      context,
                      icon: Icons.undo_rounded,
                      tooltip: 'Undo',
                      enabled: ctrl.canUndo,
                      onTap: ctrl.undo,
                    ),

                    // Redo Tool
                    _buildToolIconButton(
                      context,
                      icon: Icons.redo_rounded,
                      tooltip: 'Redo',
                      enabled: ctrl.canRedo,
                      onTap: ctrl.redo,
                    ),

                    Container(
                      height: 18,
                      width: 1,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                    ),

                    // Split Tool (Scissors) with sub-second precision
                    _buildToolIconButton(
                      context,
                      icon: Icons.content_cut_rounded,
                      tooltip: 'split_clip'.tr,
                      onTap: () {
                        final inClipSec = ctrl.virtualCurrentPosition.inMilliseconds / 1000.0;
                        ctrl.splitClip(ctrl.selectedClipIndex, inClipSec > 0.1 ? inClipSec : 1.0);
                      },
                    ),

                    // Duplicate Tool
                    _buildToolIconButton(
                      context,
                      icon: Icons.copy_rounded,
                      tooltip: 'duplicate_clip'.tr,
                      onTap: () => ctrl.duplicateClip(ctrl.selectedClipIndex),
                    ),

                    // Edit Details Tool
                    if (selectedClip != null)
                      _buildToolIconButton(
                        context,
                        icon: Icons.tune_rounded,
                        tooltip: 'edit_clip'.tr,
                        onTap: () => VideoClipEditorDialog.show(context, ctrl.selectedClipIndex, selectedClip),
                      ),

                    // Delete Clip Tool
                    _buildToolIconButton(
                      context,
                      icon: Icons.delete_outline_rounded,
                      tooltip: 'delete_clip'.tr,
                      color: Colors.redAccent,
                      onTap: () => _confirmDeleteClip(context, ctrl, ctrl.selectedClipIndex),
                    ),

                    Container(
                      height: 18,
                      width: 1,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                    ),

                    // Add Text Overlay
                    _buildToolIconButton(
                      context,
                      icon: Icons.title_rounded,
                      tooltip: 'add_text'.tr,
                      onTap: () => VideoTextOverlayDialog.show(context),
                    ),

                    // Add Clip
                    _buildToolIconButton(
                      context,
                      icon: Icons.video_call_rounded,
                      tooltip: 'add_clip'.tr,
                      onTap: () => AddClipBottomSheet.show(context),
                    ),

                    Container(
                      height: 18,
                      width: 1,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
                    ),

                    // Zoom Out
                    _buildToolIconButton(
                      context,
                      icon: Icons.zoom_out_rounded,
                      tooltip: 'Zoom Out',
                      onTap: ctrl.zoomOut,
                    ),

                    // Zoom In
                    _buildToolIconButton(
                      context,
                      icon: Icons.zoom_in_rounded,
                      tooltip: 'Zoom In',
                      onTap: ctrl.zoomIn,
                    ),
                  ],
                ),
              ),
            ),

            // Multi-Track Timeline Body with Pinch-To-Zoom Gesture
            Container(
              height: 180,
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.6)),
              ),
              clipBehavior: Clip.antiAlias,
              child: Row(
                children: [
                  // Track Headers (Left Column)
                  Container(
                    width: 58,
                    color: Theme.of(context).scaffoldBackgroundColor,
                    child: Column(
                      children: [
                        // Ruler Header
                        Container(
                          height: 24,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            border: Border(bottom: BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3))),
                          ),
                          child: Text(
                            'Time',
                            style: robotoMedium.copyWith(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          ),
                        ),
                        // Track 1: Text
                        Container(
                          height: 32,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            border: Border(bottom: BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2))),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.title, size: 12, color: Colors.amber),
                              const SizedBox(width: 2),
                              Text('Text', style: robotoMedium.copyWith(fontSize: 9)),
                            ],
                          ),
                        ),
                        // Track 2: Video
                        Container(
                          height: 58,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            border: Border(bottom: BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2))),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.movie, size: 12, color: AppColors.gradientStart),
                              const SizedBox(width: 2),
                              Text('Video', style: robotoMedium.copyWith(fontSize: 9)),
                            ],
                          ),
                        ),
                        // Track 3: Audio
                        Container(
                          height: 34,
                          alignment: Alignment.center,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.music_note, size: 12, color: Colors.teal),
                              const SizedBox(width: 2),
                              Text('Audio', style: robotoMedium.copyWith(fontSize: 9)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Scrollable Tracks & Interactive Needle (Right Column)
                  Expanded(
                    child: GestureDetector(
                      onScaleStart: (_) {
                        _baseZoom = ctrl.timelineZoom;
                      },
                      onScaleUpdate: (details) {
                        if (details.scale != 1.0) {
                          ctrl.setTimelineZoom((_baseZoom * details.scale).clamp(12.0, 72.0));
                        }
                      },
                      child: SingleChildScrollView(
                        controller: _scrollController,
                        scrollDirection: Axis.horizontal,
                        child: SizedBox(
                          width: timelineWidth,
                          child: Stack(
                            children: [
                              // Main Tracks Column
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Layer 1: Time Ruler (24px)
                                  GestureDetector(
                                    onTapDown: (details) {
                                      final double clickedSeconds = details.localPosition.dx / zoom;
                                      ctrl.seekGlobalTimeline(clickedSeconds);
                                    },
                                    onHorizontalDragUpdate: (details) {
                                      final double scrubbedSeconds = details.localPosition.dx / zoom;
                                      ctrl.seekGlobalTimeline(scrubbedSeconds);
                                    },
                                    child: Container(
                                      height: 24,
                                      width: timelineWidth,
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.5),
                                        border: Border(
                                          bottom: BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3)),
                                        ),
                                      ),
                                      child: CustomPaint(
                                        painter: _TimelineRulerPainter(
                                          totalSeconds: totalDuration + 5,
                                          zoom: zoom,
                                          textColor: Theme.of(context).colorScheme.onSurfaceVariant,
                                          lineColor: Theme.of(context).colorScheme.outline,
                                        ),
                                      ),
                                    ),
                                  ),

                                  // Layer 2: Track 1 - Text Overlays (32px)
                                  Container(
                                    height: 32,
                                    width: timelineWidth,
                                    decoration: BoxDecoration(
                                      border: Border(
                                        bottom: BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2)),
                                      ),
                                    ),
                                    child: Stack(
                                      children: ctrl.textOverlays.asMap().entries.map((entry) {
                                        final i = entry.key;
                                        final overlay = entry.value;
                                        final double leftPos = overlay.start * zoom;
                                        final double blockWidth = overlay.length * zoom;

                                        return Positioned(
                                          left: leftPos,
                                          width: blockWidth.clamp(20.0, 5000.0),
                                          top: 3,
                                          bottom: 3,
                                          child: GestureDetector(
                                            onTap: () => VideoTextOverlayDialog.show(context, overlayIndex: i, overlay: overlay),
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Colors.amber.shade700.withValues(alpha: 0.8),
                                                borderRadius: BorderRadius.circular(4),
                                                border: Border.all(color: Colors.amber.shade300, width: 1),
                                              ),
                                              alignment: Alignment.centerLeft,
                                              child: Text(
                                                overlay.text,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: robotoMedium.copyWith(color: Colors.white, fontSize: 10),
                                              ),
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ),

                                  // Layer 3: Track 2 - Video Clips (58px) with CapCut Drag Trim Handles
                                  Container(
                                    height: 58,
                                    width: timelineWidth,
                                    decoration: BoxDecoration(
                                      border: Border(
                                        bottom: BorderSide(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2)),
                                      ),
                                    ),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: clips.asMap().entries.map((entry) {
                                        final i = entry.key;
                                        final clip = entry.value;
                                        final isSelected = ctrl.selectedClipIndex == i;
                                        final double clipWidth = clip.length * zoom;

                                        return Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            _buildInteractiveClipContainer(
                                              context: context,
                                              ctrl: ctrl,
                                              index: i,
                                              clip: clip,
                                              isSelected: isSelected,
                                              clipWidth: clipWidth,
                                              zoom: zoom,
                                            ),

                                            // In-between Transition Badge
                                            if (i < clips.length - 1)
                                              GestureDetector(
                                                onTap: () => VideoClipEditorDialog.show(context, i + 1, clips[i + 1]),
                                                child: Container(
                                                  margin: const EdgeInsets.symmetric(horizontal: 2),
                                                  padding: const EdgeInsets.all(3),
                                                  decoration: BoxDecoration(
                                                    color: Theme.of(context).scaffoldBackgroundColor,
                                                    shape: BoxShape.circle,
                                                    border: Border.all(
                                                      color: clips[i + 1].transitionIn != null
                                                          ? AppColors.gradientStart
                                                          : Theme.of(context).colorScheme.outline,
                                                    ),
                                                  ),
                                                  child: Icon(
                                                    clips[i + 1].transitionIn != null ? Icons.bolt_rounded : Icons.link,
                                                    size: 10,
                                                    color: clips[i + 1].transitionIn != null
                                                        ? AppColors.gradientStart
                                                        : Theme.of(context).colorScheme.onSurfaceVariant,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        );
                                      }).toList(),
                                    ),
                                  ),

                                  // Layer 4: Track 3 - Audio Soundtrack (34px)
                                  Container(
                                    height: 34,
                                    width: timelineWidth,
                                    alignment: Alignment.centerLeft,
                                    child: ctrl.soundtrackUrl.isNotEmpty
                                        ? Stack(
                                            children: [
                                              Positioned(
                                                left: ctrl.soundtrackStartOffset * zoom,
                                                top: 4,
                                                bottom: 4,
                                                width: (totalDuration * zoom).clamp(50.0, 5000.0),
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: Colors.teal.withValues(alpha: 0.7),
                                                    borderRadius: BorderRadius.circular(4),
                                                    border: Border.all(color: Colors.tealAccent, width: 1),
                                                  ),
                                                  child: Row(
                                                    children: [
                                                      const Icon(Icons.graphic_eq_rounded, size: 14, color: Colors.white),
                                                      const SizedBox(width: 4),
                                                      Expanded(
                                                        child: Text(
                                                          '${ctrl.soundtrackUrl.split('/').last} (${(ctrl.soundtrackVolume * 100).round()}%)',
                                                          maxLines: 1,
                                                          overflow: TextOverflow.ellipsis,
                                                          style: robotoMedium.copyWith(color: Colors.white, fontSize: 9),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                            ],
                                          )
                                        : Padding(
                                            padding: const EdgeInsets.only(left: 8),
                                            child: Text(
                                              'no_soundtrack'.tr,
                                              style: robotoRegular.copyWith(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                            ),
                                          ),
                                  ),
                                ],
                              ),

                              // Layer 5: Unified Red Playhead Needle & Scrubber Head (CapCut Style)
                              Positioned(
                                left: (playheadX - 14).clamp(0.0, timelineWidth),
                                top: 0,
                                bottom: 0,
                                child: GestureDetector(
                                  behavior: HitTestBehavior.translucent,
                                  onHorizontalDragUpdate: (details) {
                                    final double newX = playheadX + details.delta.dx;
                                    final double newSec = (newX / zoom).clamp(0.0, totalDuration);
                                    ctrl.seekGlobalTimeline(newSec);
                                  },
                                  child: SizedBox(
                                    width: 28,
                                    child: Stack(
                                      alignment: Alignment.topCenter,
                                      children: [
                                        // Vertical Needle Line
                                        Positioned(
                                          top: 10,
                                          bottom: 0,
                                          child: Container(
                                            width: 2.5,
                                            decoration: BoxDecoration(
                                              color: Colors.redAccent,
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.redAccent.withValues(alpha: 0.4),
                                                  blurRadius: 2,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        // Top Playhead Scrubber Cap
                                        Container(
                                          width: 14,
                                          height: 14,
                                          decoration: const BoxDecoration(
                                            color: Colors.redAccent,
                                            shape: BoxShape.circle,
                                            boxShadow: [
                                              BoxShadow(color: Colors.black45, blurRadius: 3, offset: Offset(0, 1)),
                                            ],
                                          ),
                                          child: const Center(
                                            child: Icon(Icons.arrow_drop_down, size: 12, color: Colors.white),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  // CapCut Interactive Clip Container with Direct Left & Right Edge Drag Trimming
  Widget _buildInteractiveClipContainer({
    required BuildContext context,
    required VideoEditorController ctrl,
    required int index,
    required TimelineClipModel clip,
    required bool isSelected,
    required double clipWidth,
    required double zoom,
  }) {
    final hasLocal = clip.localPath != null && File(clip.localPath!).existsSync();

    return GestureDetector(
      onTap: () => ctrl.selectClip(index),
      onDoubleTap: () => VideoClipEditorDialog.show(context, index, clip),
      child: Container(
        width: clipWidth.clamp(32.0, 5000.0),
        height: 52,
        margin: const EdgeInsets.symmetric(vertical: 3),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.gradientStart.withValues(alpha: 0.25)
              : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.outline,
            width: isSelected ? 2.0 : 1.0,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            // Background Image / Thumbnail Preview
            if (clip.isImage)
              Positioned.fill(
                child: Opacity(
                  opacity: 0.35,
                  child: hasLocal
                      ? Image.file(File(clip.localPath!), fit: BoxFit.cover)
                      : (clip.videoUrl.isNotEmpty
                          ? Image.network(clip.videoUrl, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox.shrink())
                          : const SizedBox.shrink()),
                ),
              ),

            // Content Info: #Number, Duration, Speed, Mode
            Positioned.fill(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: isSelected ? 12.0 : 4.0, vertical: 4.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '#${index + 1}',
                          style: robotoBold.copyWith(
                            fontSize: 9,
                            color: isSelected ? AppColors.gradientStart : Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                        Text(
                          '${clip.length.toStringAsFixed(1)}s',
                          style: robotoRegular.copyWith(fontSize: 8),
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Icon(
                          clip.isImage ? Icons.image : Icons.movie_filter_rounded,
                          size: 13,
                          color: isSelected ? AppColors.gradientStart : Colors.grey,
                        ),
                        if (clip.speed != 1.0)
                          Text(
                            '${clip.speed}x',
                            style: const TextStyle(fontSize: 8, color: Colors.amber, fontWeight: FontWeight.bold),
                          ),
                        GestureDetector(
                          onTap: () => VideoClipEditorDialog.show(context, index, clip),
                          child: const Icon(Icons.tune_rounded, size: 12, color: AppColors.gradientStart),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Left Drag Handle (Trim Start / In-point)
            if (isSelected)
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onHorizontalDragUpdate: (details) {
                    final deltaSec = details.delta.dx / zoom;
                    final newTrim = (clip.trim + deltaSec).clamp(0.0, 60.0);
                    final newLen = (clip.length - deltaSec).clamp(0.2, 60.0);
                    ctrl.updateClipTrimRange(
                      index,
                      double.parse(newTrim.toStringAsFixed(2)),
                      double.parse(newLen.toStringAsFixed(2)),
                    );
                  },
                  child: Container(
                    width: 10,
                    decoration: const BoxDecoration(
                      color: AppColors.gradientStart,
                      borderRadius: BorderRadius.horizontal(left: Radius.circular(4)),
                    ),
                    alignment: Alignment.center,
                    child: Container(
                      width: 2,
                      height: 16,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),

            // Right Drag Handle (Trim End / Out-point)
            if (isSelected)
              Positioned(
                right: 0,
                top: 0,
                bottom: 0,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onHorizontalDragUpdate: (details) {
                    final deltaSec = details.delta.dx / zoom;
                    final newLen = (clip.length + deltaSec).clamp(0.2, 60.0);
                    ctrl.updateClipDuration(
                      index,
                      double.parse(newLen.toStringAsFixed(2)),
                    );
                  },
                  child: Container(
                    width: 10,
                    decoration: const BoxDecoration(
                      color: AppColors.gradientStart,
                      borderRadius: BorderRadius.horizontal(right: Radius.circular(4)),
                    ),
                    alignment: Alignment.center,
                    child: Container(
                      width: 2,
                      height: 16,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildToolIconButton(
    BuildContext context, {
    required IconData icon,
    required String tooltip,
    required VoidCallback onTap,
    bool enabled = true,
    Color? color,
  }) {
    final finalColor = enabled
        ? (color ?? Theme.of(context).colorScheme.onSurface)
        : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.25);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Tooltip(
        message: tooltip,
        child: InkWell(
          onTap: enabled ? onTap : null,
          borderRadius: BorderRadius.circular(4),
          child: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: enabled ? 0.3 : 0.1)),
            ),
            child: Icon(icon, size: 16, color: finalColor),
          ),
        ),
      ),
    );
  }
}

class _TimelineRulerPainter extends CustomPainter {
  final double totalSeconds;
  final double zoom;
  final Color textColor;
  final Color lineColor;

  _TimelineRulerPainter({
    required this.totalSeconds,
    required this.zoom,
    required this.textColor,
    required this.lineColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final linePaint = Paint()
      ..color = lineColor.withValues(alpha: 0.4)
      ..strokeWidth = 1.0;

    final textStyle = TextStyle(
      color: textColor,
      fontSize: 8.0,
      fontWeight: FontWeight.normal,
    );

    final int maxSec = totalSeconds.ceil();

    for (int sec = 0; sec <= maxSec; sec++) {
      final double x = sec * zoom;
      final bool isMajor = sec % 5 == 0;
      final double tickHeight = isMajor ? 10.0 : 5.0;

      // Draw tick line
      canvas.drawLine(
        Offset(x, size.height - tickHeight),
        Offset(x, size.height),
        linePaint,
      );

      // Draw second label for major ticks
      if (isMajor) {
        final textSpan = TextSpan(text: '${sec}s', style: textStyle);
        final textPainter = TextPainter(
          text: textSpan,
          textDirection: TextDirection.ltr,
        )..layout();
        textPainter.paint(canvas, Offset(x + 2, 2));
      }
    }
  }

  @override
  bool shouldRepaint(covariant _TimelineRulerPainter oldDelegate) {
    return oldDelegate.totalSeconds != totalSeconds || oldDelegate.zoom != zoom;
  }
}
