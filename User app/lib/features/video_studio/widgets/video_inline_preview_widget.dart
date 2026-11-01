import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';
import 'package:video_player/video_player.dart';

class VideoEditorInlinePreviewWidget extends StatelessWidget {
  const VideoEditorInlinePreviewWidget({super.key});

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  Alignment _resolvePosition(String pos) {
    switch (pos) {
      case 'topLeft':
        return Alignment.topLeft;
      case 'top':
        return Alignment.topCenter;
      case 'topRight':
        return Alignment.topRight;
      case 'left':
        return Alignment.centerLeft;
      case 'center':
        return Alignment.center;
      case 'right':
        return Alignment.centerRight;
      case 'bottomLeft':
        return Alignment.bottomLeft;
      case 'bottomRight':
        return Alignment.bottomRight;
      case 'bottom':
      default:
        return Alignment.bottomCenter;
    }
  }

  double _resolveFontSize(String size) {
    switch (size) {
      case 'small':
        return 12.0;
      case 'large':
        return 20.0;
      case 'medium':
      default:
        return 16.0;
    }
  }

  Color _parseHexColor(String hex, {Color fallback = Colors.white}) {
    try {
      String clean = hex.replaceAll('#', '');
      if (clean.length == 6) clean = 'FF$clean';
      if (clean.length == 8) {
        return Color(int.parse('0x$clean'));
      }
    } catch (_) {}
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoEditorController>(
      builder: (ctrl) {
        final clips = ctrl.clips;
        final selectedIndex = ctrl.selectedClipIndex;
        final hasClip = clips.isNotEmpty && selectedIndex < clips.length;
        final activeClip = hasClip ? clips[selectedIndex] : null;

        double ratio = 16 / 9;
        switch (ctrl.selectedAspectRatio) {
          case '9:16':
            ratio = 9 / 16;
            break;
          case '1:1':
            ratio = 1 / 1;
            break;
          case '4:5':
            ratio = 4 / 5;
            break;
          case '4:3':
            ratio = 4 / 3;
            break;
        }

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
            border: Border.all(color: Theme.of(context).colorScheme.outline),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Screen Area with Aspect Ratio
              Container(
                height: 200,
                width: double.infinity,
                color: Colors.black,
                alignment: Alignment.center,
                child: AspectRatio(
                  aspectRatio: ratio,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Video Player / Image / Placeholder
                      if (hasClip && activeClip != null) ...[
                        if (activeClip.isImage)
                          Image.network(
                            activeClip.videoUrl,
                            fit: activeClip.fit == 'contain' ? BoxFit.contain : BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Center(
                              child: Icon(Icons.broken_image, color: Colors.white54, size: 36),
                            ),
                          )
                        else if (ctrl.playerController != null && ctrl.isPlayerInitialized)
                          FittedBox(
                            fit: activeClip.fit == 'contain' ? BoxFit.contain : BoxFit.cover,
                            child: SizedBox(
                              width: ctrl.playerController!.value.size.width,
                              height: ctrl.playerController!.value.size.height,
                              child: VideoPlayer(ctrl.playerController!),
                            ),
                          )
                        else
                          Container(
                            color: Colors.black87,
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.gradientStart),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    '#${selectedIndex + 1} (${activeClip.length}s)',
                                    style: robotoMedium.copyWith(color: Colors.white70, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                          )
                      ] else ...[
                        Center(
                          child: Text(
                            'no_clips_added'.tr,
                            style: robotoRegular.copyWith(color: Colors.white54),
                          ),
                        ),
                      ],

                      // Live Text Overlays Rendered On Screen
                      if (hasClip && ctrl.textOverlays.isNotEmpty)
                        ...ctrl.textOverlays.map((overlay) {
                          final currentSec = ctrl.currentPosition.inSeconds;
                          final isVisible = currentSec >= overlay.start && currentSec < (overlay.start + overlay.length);
                          if (!isVisible) return const SizedBox.shrink();

                          final align = _resolvePosition(overlay.position);
                          final fontSize = _resolveFontSize(overlay.size);
                          final textColor = _parseHexColor(overlay.color, fallback: Colors.white);
                          final bgColor = overlay.background != null && overlay.background!.isNotEmpty
                              ? _parseHexColor(overlay.background!)
                              : Colors.transparent;

                          return Align(
                            alignment: align,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: bgColor,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  overlay.text,
                                  textAlign: TextAlign.center,
                                  style: robotoBold.copyWith(
                                    fontSize: fontSize,
                                    color: textColor,
                                    shadows: [
                                      Shadow(
                                        color: Colors.black.withValues(alpha: 0.8),
                                        blurRadius: 4,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        }),

                      // Watermark / Logo Overlay
                      if (ctrl.watermark != null && ctrl.watermark!.url.isNotEmpty)
                        Align(
                          alignment: _resolvePosition(ctrl.watermark!.position),
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: Opacity(
                              opacity: ctrl.watermark!.opacity.clamp(0.1, 1.0),
                              child: FractionallySizedBox(
                                widthFactor: ctrl.watermark!.scale.clamp(0.05, 0.4),
                                child: Image.network(
                                  ctrl.watermark!.url,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                                ),
                              ),
                            ),
                          ),
                        ),

                      // Mode Badge: Play All Sequence Indicator
                      if (ctrl.isPlayAllSequence)
                        Positioned(
                          top: 8,
                          left: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.gradientStart.withValues(alpha: 0.85),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.playlist_play_rounded, size: 14, color: Colors.white),
                                const SizedBox(width: 4),
                                Text(
                                  'playing_sequence'.tr,
                                  style: robotoMedium.copyWith(color: Colors.white, fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),

              // Player Scrubber Bar & Controls
              if (hasClip)
                Container(
                  color: Colors.black.withValues(alpha: 0.95),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Scrubber Slider
                      Row(
                        children: [
                          Text(
                            _formatDuration(ctrl.currentPosition),
                            style: robotoRegular.copyWith(color: Colors.white70, fontSize: 10),
                          ),
                          Expanded(
                            child: SliderTheme(
                              data: SliderTheme.of(context).copyWith(
                                trackHeight: 2.5,
                                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 5),
                                overlayShape: const RoundSliderOverlayShape(overlayRadius: 10),
                                activeTrackColor: AppColors.gradientStart,
                                inactiveTrackColor: Colors.white24,
                                thumbColor: Colors.white,
                              ),
                              child: Slider(
                                value: ctrl.currentPosition.inMilliseconds
                                    .toDouble()
                                    .clamp(0.0, ctrl.clipDuration.inMilliseconds.toDouble() > 0 ? ctrl.clipDuration.inMilliseconds.toDouble() : 1.0),
                                min: 0.0,
                                max: ctrl.clipDuration.inMilliseconds.toDouble() > 0 ? ctrl.clipDuration.inMilliseconds.toDouble() : 1.0,
                                onChanged: (val) {
                                  ctrl.seekTo(Duration(milliseconds: val.round()));
                                },
                              ),
                            ),
                          ),
                          Text(
                            _formatDuration(ctrl.clipDuration),
                            style: robotoRegular.copyWith(color: Colors.white70, fontSize: 10),
                          ),
                        ],
                      ),

                      // Control Buttons Bar
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              IconButton(
                                icon: Icon(
                                  ctrl.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                  color: Colors.white,
                                  size: 24,
                                ),
                                onPressed: ctrl.togglePlayPause,
                              ),
                              IconButton(
                                icon: Icon(
                                  ctrl.isPlayerMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                                  color: ctrl.isPlayerMuted ? Colors.redAccent : Colors.white70,
                                  size: 20,
                                ),
                                onPressed: ctrl.toggleMute,
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              // Sequence Play All Toggle
                              InkWell(
                                onTap: ctrl.togglePlayAllSequence,
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: ctrl.isPlayAllSequence ? AppColors.gradientStart : Colors.white12,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.repeat_rounded,
                                        size: 14,
                                        color: ctrl.isPlayAllSequence ? Colors.white : Colors.white70,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        ctrl.isPlayAllSequence ? 'playing_sequence'.tr : 'play_all_sequence'.tr,
                                        style: robotoMedium.copyWith(
                                          color: ctrl.isPlayAllSequence ? Colors.white : Colors.white70,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
