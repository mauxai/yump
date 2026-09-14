import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_appbar_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/gallery/controllers/cloud_gallery_controller.dart';
import 'package:lumen/features/gallery/models/cloud_edit_model.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/features/projects/views/projects_view.dart';
import 'package:lumen/features/projects/widgets/projects_view_toggle_widget.dart';
import 'package:lumen/features/video_studio/controllers/video_studio_controller.dart';
import 'package:lumen/features/video_studio/widgets/video_player_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class CreationsView extends StatefulWidget {
  const CreationsView({super.key});

  @override
  State<CreationsView> createState() => _CreationsViewState();
}

class _CreationsViewState extends State<CreationsView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _imageSubIndex = 0; // 0 = Projects, 1 = Cloud Gallery

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: CustomAppBar(
        title: 'creations'.tr,
        bottom: TabBar(
          controller: _tabController,
          labelStyle: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault),
          unselectedLabelStyle: robotoRegular.copyWith(fontSize: Dimensions.fontSizeDefault),
          labelColor: AppColors.gradientStart,
          unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
          indicatorColor: AppColors.gradientStart,
          indicatorWeight: 2,
          dividerHeight: 0,
          tabs: [
            Tab(text: 'images'.tr),
            Tab(text: 'videos'.tr),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildImagesTab(context),
          _buildVideosTab(context),
        ],
      ),
    );
  }

  Widget _buildImagesTab(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              ChoiceChip(
                label: Text('projects'.tr),
                selected: _imageSubIndex == 0,
                selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                onSelected: (_) => setState(() => _imageSubIndex = 0),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: Text('cloud_gallery'.tr),
                selected: _imageSubIndex == 1,
                selectedColor: AppColors.gradientStart.withValues(alpha: 0.2),
                onSelected: (_) => setState(() => _imageSubIndex = 1),
              ),
              if (_imageSubIndex == 0) ...[
                const Spacer(),
                GetBuilder<ProjectsController>(
                  builder: (controller) => ProjectsViewToggleWidget(
                    isGrid: controller.isGridView,
                    onToggle: controller.toggleView,
                  ),
                ),
              ],
            ],
          ),
        ),
        Expanded(
          child: _imageSubIndex == 0
              ? const ProjectsView(showHeader: false)
              : _buildCloudGalleryGrid(context),
        ),
      ],
    );
  }

  Widget _buildCloudGalleryGrid(BuildContext context) {
    return GetBuilder<CloudGalleryController>(
      builder: (ctrl) {
        if (ctrl.isLoading && ctrl.edits.isEmpty) {
          return const Center(child: CircularProgressIndicator(strokeWidth: 2));
        }

        if (ctrl.edits.isEmpty) {
          return Center(
            child: Text(
              'no_cloud_images_found'.tr,
              style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => ctrl.loadGallery(refresh: true),
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.8,
            ),
            itemCount: ctrl.edits.length,
            itemBuilder: (_, i) {
              final edit = ctrl.edits[i];
              return _CloudEditCard(edit: edit);
            },
          ),
        );
      },
    );
  }

  Widget _buildVideosTab(BuildContext context) {
    return GetBuilder<VideoStudioController>(
      builder: (ctrl) {
        if (ctrl.isLoadingGallery && ctrl.videoGallery.isEmpty) {
          return const Center(child: CircularProgressIndicator(strokeWidth: 2));
        }

        if (ctrl.videoGallery.isEmpty) {
          return Center(
            child: Text(
              'no_videos_yet'.tr,
              style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: ctrl.loadGallery,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: ctrl.videoGallery.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) {
              final video = ctrl.videoGallery[i];
              return Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  side: BorderSide(color: Theme.of(context).colorScheme.outline),
                ),
                child: ListTile(
                  title: Text(
                    video.prompt,
                    style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeDefault),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    '${video.aspectRatio} • ${video.duration}s • ${video.status}',
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeExtraSmall),
                  ),
                  trailing: video.isCompleted
                      ? IconButton(
                          icon: const Icon(Icons.play_circle_fill_rounded, color: AppColors.gradientStart, size: 30),
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (_) => VideoPlayerWidget(video: video),
                            );
                          },
                        )
                      : video.isProcessing
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.error_outline, color: Colors.redAccent),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class _CloudEditCard extends StatelessWidget {
  final CloudEditModel edit;

  const _CloudEditCard({required this.edit});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<CloudGalleryController>();

    return GestureDetector(
      onTap: () {
        showDialog(
          context: context,
          builder: (_) => Dialog(
            backgroundColor: Colors.transparent,
            insetPadding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  child: CachedNetworkImage(
                    imageUrl: edit.image,
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(edit.prompt, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            edit.projectName,
                            style: robotoMedium.copyWith(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          ),
                          IconButton(
                            icon: const Icon(Icons.download_rounded, color: AppColors.gradientStart),
                            onPressed: () => ctrl.downloadImage(edit.image, edit.id),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          border: Border.all(color: Theme.of(context).colorScheme.outline),
          color: Theme.of(context).cardColor,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: CachedNetworkImage(
                imageUrl: edit.image,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(color: Colors.black12),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(
                edit.prompt,
                style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeExtraSmall),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
