import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';
import 'package:video_player/video_player.dart';

class VideoColorFilterHelper {
  // 1:1 Matched to FFmpeg: colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131:0
  static const List<double> sepiaMatrix = [
    0.393, 0.769, 0.189, 0, 0,
    0.349, 0.686, 0.168, 0, 0,
    0.272, 0.534, 0.131, 0, 0,
    0.0,   0.0,   0.0,   1, 0,
  ];

  // 1:1 Matched to FFmpeg: colorchannelmixer=.2126:.7152:.0722:0:.2126:.7152:.0722:0:.2126:.7152:.0722:0
  static const List<double> greyscaleMatrix = [
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0.0,    0.0,    0.0,    1, 0,
  ];

  static const List<double> boostMatrix = [
    1.35, -0.15, -0.15, 0, 0,
    -0.15, 1.35, -0.15, 0, 0,
    -0.15, -0.15, 1.35, 0, 0,
    0.0,   0.0,   0.0,   1, 0,
  ];

  static const List<double> contrastMatrix = [
    1.35, 0,    0,    0, -20,
    0,    1.35, 0,    0, -20,
    0,    0,    1.35, 0, -20,
    0,    0,    0,    1, 0,
  ];

  static const List<double> darkenMatrix = [
    0.8, 0,   0,   0, -15,
    0,   0.8, 0,   0, -15,
    0,   0,   0.8, 0, -15,
    0,   0,   0,   1, 0,
  ];

  static const List<double> lightenMatrix = [
    1.15, 0,    0,    0, 20,
    0,    1.15, 0,    0, 20,
    0,    0,    1.15, 0, 20,
    0,    0,    0,    1, 0,
  ];

  static ColorFilter? getFilter(String? filterName) {
    switch (filterName) {
      case 'sepia':
        return const ColorFilter.matrix(sepiaMatrix);
      case 'greyscale':
        return const ColorFilter.matrix(greyscaleMatrix);
      case 'boost':
        return const ColorFilter.matrix(boostMatrix);
      case 'contrast':
        return const ColorFilter.matrix(contrastMatrix);
      case 'darken':
        return const ColorFilter.matrix(darkenMatrix);
      case 'lighten':
        return const ColorFilter.matrix(lightenMatrix);
      default:
        return null;
    }
  }
}

class VideoEditorInlinePreviewWidget extends StatefulWidget {
  const VideoEditorInlinePreviewWidget({super.key});

  @override
  State<VideoEditorInlinePreviewWidget> createState() => _VideoEditorInlinePreviewWidgetState();
}

class _VideoEditorInlinePreviewWidgetState extends State<VideoEditorInlinePreviewWidget> with SingleTickerProviderStateMixin {
  late AnimationController _motionController;
  int _lastClipIndex = -1;

  @override
  void initState() {
    super.initState();
    _motionController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    );
  }

  @override
  void dispose() {
    _motionController.dispose();
    super.dispose();
  }

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

        if (activeClip != null) {
          final targetDurationMs = ((activeClip.length * 1000) / (activeClip.speed > 0 ? activeClip.speed : 1.0)).round();
          if (_motionController.duration?.inMilliseconds != targetDurationMs) {
            _motionController.duration = Duration(milliseconds: targetDurationMs > 0 ? targetDurationMs : 1000);
          }

          if (selectedIndex != _lastClipIndex) {
            _lastClipIndex = selectedIndex;
            _motionController.value = ctrl.normalizedClipProgress;
          }

          if (ctrl.isPlaying) {
            if (!_motionController.isAnimating) {
              _motionController.forward(from: ctrl.normalizedClipProgress);
            }
          } else {
            if (_motionController.isAnimating) {
              _motionController.stop();
            }
            _motionController.value = ctrl.normalizedClipProgress;
          }
        }

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

        final activePlayer = ctrl.playerController;

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
              // Screen Area with Aspect Ratio & Letterboxing
              Container(
                height: 200,
                width: double.infinity,
                color: Colors.black,
                alignment: Alignment.center,
                child: AspectRatio(
                  aspectRatio: ratio,
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final canvasHeight = constraints.maxHeight;

                      Widget mediaWidget;
                      if (hasClip && activeClip != null) {
                        if (activeClip.isImage) {
                          final hasLocalImg = activeClip.localPath != null && File(activeClip.localPath!).existsSync();
                          mediaWidget = hasLocalImg
                              ? Image.file(
                                  File(activeClip.localPath!),
                                  fit: activeClip.fit == 'contain' ? BoxFit.contain : BoxFit.cover,
                                )
                              : Image.network(
                                  activeClip.videoUrl,
                                  fit: activeClip.fit == 'contain' ? BoxFit.contain : BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Center(
                                    child: Icon(Icons.broken_image, color: Colors.white54, size: 36),
                                  ),
                                );
                        } else if (activePlayer != null && ctrl.isPlayerInitialized) {
                          mediaWidget = FittedBox(
                            fit: activeClip.fit == 'contain' ? BoxFit.contain : BoxFit.cover,
                            child: SizedBox(
                              width: activePlayer.value.size.width > 0 ? activePlayer.value.size.width : 1920,
                              height: activePlayer.value.size.height > 0 ? activePlayer.value.size.height : 1080,
                              child: VideoPlayer(activePlayer),
                            ),
                          );
                        } else {
                          mediaWidget = Container(
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
                          );
                        }

                        // Apply 1:1 FFmpeg Calibrated GPU Color Filter Matrix
                        final colorFilter = VideoColorFilterHelper.getFilter(activeClip.filter);
                        if (colorFilter != null) {
                          mediaWidget = ColorFiltered(
                            colorFilter: colorFilter,
                            child: mediaWidget,
                          );
                        }

                        // Apply 60fps VSync-Decoupled Ken Burns & Transition Simulation
                        mediaWidget = AnimatedBuilder(
                          animation: _motionController,
                          builder: (context, child) {
                            final p = _motionController.value;
                            Matrix4 transform = Matrix4.identity();
                            final effect = activeClip.effect;

                            if (effect == 'zoomIn') {
                              final scale = 1.0 + (p * 0.25);
                              transform = Matrix4.diagonal3Values(scale, scale, 1.0);
                            } else if (effect == 'zoomOut') {
                              final scale = 1.25 - (p * 0.25);
                              transform = Matrix4.diagonal3Values(scale, scale, 1.0);
                            } else if (effect == 'slideLeft') {
                              transform = Matrix4.translationValues(-p * 30.0, 0, 0);
                            } else if (effect == 'slideRight') {
                              transform = Matrix4.translationValues(p * 30.0, 0, 0);
                            } else if (effect == 'slideUp') {
                              transform = Matrix4.translationValues(0, -p * 30.0, 0);
                            } else if (effect == 'slideDown') {
                              transform = Matrix4.translationValues(0, p * 30.0, 0);
                            }

                            // Fade In / Fade Out Transition Simulation
                            double opacity = 1.0;
                            final lengthSec = activeClip.length.toDouble();
                            if (lengthSec > 0) {
                              final curSec = p * lengthSec;
                              if (activeClip.transitionIn == 'fade' && curSec < 0.5) {
                                opacity = (curSec / 0.5).clamp(0.0, 1.0);
                              } else if (activeClip.transitionOut == 'fade' && (lengthSec - curSec) < 0.5) {
                                opacity = ((lengthSec - curSec) / 0.5).clamp(0.0, 1.0);
                              }
                            }

                            Widget motionContent = Transform(
                              transform: transform,
                              alignment: Alignment.center,
                              child: child,
                            );

                            if (opacity < 1.0) {
                              motionContent = Opacity(opacity: opacity, child: motionContent);
                            }

                            // Loop seek freeze mask (prevents raw overrun flash)
                            if (ctrl.isLoopSeeking) {
                              motionContent = ColorFiltered(
                                colorFilter: ColorFilter.mode(
                                  Colors.black.withValues(alpha: 0.15),
                                  BlendMode.darken,
                                ),
                                child: motionContent,
                              );
                            }

                            return motionContent;
                          },
                          child: mediaWidget,
                        );
                      } else {
                        mediaWidget = Center(
                          child: Text(
                            'no_clips_added'.tr,
                            style: robotoRegular.copyWith(color: Colors.white54),
                          ),
                        );
                      }

                      return Stack(
                        fit: StackFit.expand,
                        children: [
                          mediaWidget,

                          // Resolution-Independent Live Text Overlays
                          if (hasClip && ctrl.textOverlays.isNotEmpty)
                            ...ctrl.textOverlays.map((overlay) {
                              final currentSec = ctrl.globalPlayheadSeconds.round();
                              final isVisible = currentSec >= overlay.start && currentSec < (overlay.start + overlay.length);
                              if (!isVisible) return const SizedBox.shrink();

                              final align = _resolvePosition(overlay.position);
                              double fontSize;
                              if (overlay.size == 'small') {
                                fontSize = canvasHeight * 0.06;
                              } else if (overlay.size == 'large') {
                                fontSize = canvasHeight * 0.11;
                              } else {
                                fontSize = canvasHeight * 0.08;
                              }

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
                                        fontSize: fontSize.clamp(10.0, 32.0),
                                        color: textColor,
                                        shadows: [
                                          Shadow(
                                            color: Colors.black.withValues(alpha: 0.85),
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
                      );
                    },
                  ),
                ),
              ),

              // Accurate Virtual Scrubber Bar & Controls
              if (hasClip)
                Container(
                  color: Colors.black.withValues(alpha: 0.95),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Scrubber Slider strictly clamped to [0, clip.length]
                      Row(
                        children: [
                          Text(
                            _formatDuration(ctrl.virtualCurrentPosition),
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
                                value: ctrl.virtualCurrentPosition.inMilliseconds
                                    .toDouble()
                                    .clamp(0.0, ctrl.virtualClipDuration.inMilliseconds.toDouble() > 0 ? ctrl.virtualClipDuration.inMilliseconds.toDouble() : 1.0),
                                min: 0.0,
                                max: ctrl.virtualClipDuration.inMilliseconds.toDouble() > 0 ? ctrl.virtualClipDuration.inMilliseconds.toDouble() : 1.0,
                                onChanged: (val) {
                                  ctrl.seekToVirtual(Duration(milliseconds: val.round()));
                                  _motionController.value = ctrl.normalizedClipProgress;
                                },
                              ),
                            ),
                          ),
                          Text(
                            _formatDuration(ctrl.virtualClipDuration),
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
