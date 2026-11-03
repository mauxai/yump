import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/features/video_studio/controllers/video_studio_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class AddClipBottomSheet extends StatefulWidget {
  const AddClipBottomSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
      ),
      builder: (_) => const AddClipBottomSheet(),
    );
  }

  @override
  State<AddClipBottomSheet> createState() => _AddClipBottomSheetState();
}

class _AddClipBottomSheetState extends State<AddClipBottomSheet> {
  int _selectedTab = 0; // 0: Options, 1: AI Creations, 2: URL Input
  final TextEditingController _urlController = TextEditingController();

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _pickFromDevice(VideoEditorController ctrl) async {
    final picker = ImagePicker();
    final picked = await picker.pickVideo(source: ImageSource.gallery);
    if (picked != null) {
      if (!mounted) return;
      Navigator.pop(context);
      ctrl.addClip(picked.path, localPath: picked.path);
    }
  }

  Future<void> _pickMultipleFromDevice(VideoEditorController ctrl) async {
    final picker = ImagePicker();
    try {
      final pickedList = await picker.pickMultipleMedia();
      if (pickedList.isNotEmpty) {
        if (!mounted) return;
        Navigator.pop(context);
        for (final item in pickedList) {
          final isImg = item.path.toLowerCase().endsWith('.jpg') ||
              item.path.toLowerCase().endsWith('.jpeg') ||
              item.path.toLowerCase().endsWith('.png') ||
              item.path.toLowerCase().endsWith('.webp');
          ctrl.addClip(item.path, length: isImg ? 4.0 : 5.0, isImage: isImg, localPath: item.path);
        }
      }
    } catch (_) {
      _pickFromDevice(ctrl);
    }
  }

  Future<void> _pickPhotoSlide(VideoEditorController ctrl) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      if (!mounted) return;
      Navigator.pop(context);
      ctrl.addClip(picked.path, length: 4.0, isImage: true, localPath: picked.path);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<VideoEditorController>();

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: Dimensions.paddingSizeLarge,
          right: Dimensions.paddingSizeLarge,
          top: Dimensions.paddingSizeLarge,
          bottom: MediaQuery.of(context).viewInsets.bottom + Dimensions.paddingSizeLarge,
        ),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: _selectedTab == 0
              ? _buildOptionsView(ctrl)
              : _selectedTab == 1
                  ? _buildAiCreationsView(ctrl)
                  : _buildUrlInputView(ctrl),
        ),
      ),
    );
  }

  Widget _buildOptionsView(VideoEditorController ctrl) {
    return Column(
      key: const ValueKey('options'),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('add_clip'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
        const SizedBox(height: 12),

        ListTile(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
          tileColor: Theme.of(context).scaffoldBackgroundColor,
          leading: const Icon(Icons.video_library_rounded, color: AppColors.gradientStart),
          title: Text('pick_video_from_gallery'.tr, style: robotoMedium),
          trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
          onTap: () => _pickFromDevice(ctrl),
        ),
        const SizedBox(height: 10),

        ListTile(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
          tileColor: Theme.of(context).scaffoldBackgroundColor,
          leading: const Icon(Icons.video_collection_rounded, color: Colors.indigoAccent),
          title: Text('pick_multiple_videos'.tr, style: robotoMedium),
          trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
          onTap: () => _pickMultipleFromDevice(ctrl),
        ),
        const SizedBox(height: 10),

        ListTile(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
          tileColor: Theme.of(context).scaffoldBackgroundColor,
          leading: const Icon(Icons.add_photo_alternate_rounded, color: Colors.teal),
          title: Text('add_photo_slide'.tr, style: robotoMedium),
          trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
          onTap: () => _pickPhotoSlide(ctrl),
        ),
        const SizedBox(height: 10),

        ListTile(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
          tileColor: Theme.of(context).scaffoldBackgroundColor,
          leading: const Icon(Icons.auto_awesome, color: AppColors.gradientEnd),
          title: Text('pick_from_ai_creations'.tr, style: robotoMedium),
          trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
          onTap: () => setState(() => _selectedTab = 1),
        ),
        const SizedBox(height: 10),

        ListTile(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
          tileColor: Theme.of(context).scaffoldBackgroundColor,
          leading: const Icon(Icons.link_rounded, color: Colors.blueAccent),
          title: Text('enter_video_url'.tr, style: robotoMedium),
          trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
          onTap: () => setState(() => _selectedTab = 2),
        ),
      ],
    );
  }

  Widget _buildAiCreationsView(VideoEditorController ctrl) {
    List aiVideos = [];
    if (Get.isRegistered<VideoStudioController>()) {
      aiVideos = Get.find<VideoStudioController>().videoGallery.where((v) => v.isCompleted && v.videoUrl != null).toList();
    }

    return Column(
      key: const ValueKey('ai_creations'),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => setState(() => _selectedTab = 0),
            ),
            Text('pick_from_ai_creations'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
          ],
        ),
        const SizedBox(height: 12),
        if (aiVideos.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text(
                'no_videos_yet'.tr,
                style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ),
          )
        else
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 280),
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: aiVideos.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final v = aiVideos[i];
                return ListTile(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
                  tileColor: Theme.of(context).scaffoldBackgroundColor,
                  leading: const Icon(Icons.movie_creation_outlined, color: AppColors.gradientStart),
                  title: Text(v.prompt, maxLines: 1, overflow: TextOverflow.ellipsis, style: robotoMedium),
                  subtitle: Text('${v.aspectRatio} • ${v.duration}s', style: robotoRegular.copyWith(fontSize: 12)),
                  trailing: const Icon(Icons.add_circle_outline, color: AppColors.gradientStart),
                  onTap: () {
                    ctrl.addClip(v.videoUrl!, length: v.duration);
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildUrlInputView(VideoEditorController ctrl) {
    return Column(
      key: const ValueKey('url_input'),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => setState(() => _selectedTab = 0),
            ),
            Text('enter_video_url'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _urlController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'https://example.com/video.mp4',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gradientStart,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusDefault)),
            ),
            onPressed: () {
              final url = _urlController.text.trim();
              if (url.isNotEmpty) {
                ctrl.addClip(url);
              }
              Navigator.pop(context);
            },
            child: Text('add_clip'.tr, style: robotoMedium),
          ),
        ),
      ],
    );
  }
}
