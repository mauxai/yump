import 'dart:io';
import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:gal/gal.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/models/video_models.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_player/video_player.dart';

class VideoPlayerWidget extends StatefulWidget {
  final VideoRecord video;

  const VideoPlayerWidget({super.key, required this.video});

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  VideoPlayerController? _videoPlayerController;
  ChewieController? _chewieController;
  bool _isDownloading = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _initPlayer();
  }

  Future<void> _initPlayer() async {
    if (widget.video.videoUrl == null || widget.video.videoUrl!.isEmpty) {
      setState(() => _hasError = true);
      return;
    }

    try {
      _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(widget.video.videoUrl!));
      await _videoPlayerController!.initialize();

      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController!,
        autoPlay: true,
        looping: true,
        aspectRatio: _videoPlayerController!.value.aspectRatio,
        allowFullScreen: true,
        allowMuting: true,
        materialProgressColors: ChewieProgressColors(
          playedColor: AppColors.gradientStart,
          handleColor: AppColors.gradientEnd,
          backgroundColor: Colors.white24,
          bufferedColor: Colors.white38,
        ),
      );
      setState(() {});
    } catch (_) {
      setState(() => _hasError = true);
    }
  }

  Future<void> _downloadVideo() async {
    if (widget.video.videoUrl == null) return;
    setState(() => _isDownloading = true);

    try {
      final res = await http.get(Uri.parse(widget.video.videoUrl!));
      final tempDir = await getTemporaryDirectory();
      final filePath = '${tempDir.path}/video_${widget.video.id}.mp4';
      final file = File(filePath);
      await file.writeAsBytes(res.bodyBytes);

      await Gal.putVideo(filePath);
      showCustomSnackBar('video_saved_to_gallery'.tr, isError: false);
    } catch (e) {
      showCustomSnackBar('failed_to_save_video'.tr);
    } finally {
      setState(() => _isDownloading = false);
    }
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoPlayerController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.black,
      insetPadding: const EdgeInsets.all(12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusLarge)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    widget.video.prompt,
                    style: robotoMedium.copyWith(color: Colors.white, fontSize: Dimensions.fontSizeSmall),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
            child: AspectRatio(
              aspectRatio: _videoPlayerController?.value.isInitialized == true
                  ? _videoPlayerController!.value.aspectRatio
                  : 16 / 9,
              child: _hasError
                  ? Center(
                      child: Text(
                        'failed_to_load_video'.tr,
                        style: robotoRegular.copyWith(color: Colors.white70),
                      ),
                    )
                  : _chewieController != null && _chewieController!.videoPlayerController.value.isInitialized
                      ? Chewie(controller: _chewieController!)
                      : const Center(child: CircularProgressIndicator(color: AppColors.gradientStart)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gradientStart,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  onPressed: _isDownloading ? null : _downloadVideo,
                  icon: _isDownloading
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.download_rounded, size: 18),
                  label: Text('download'.tr),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
