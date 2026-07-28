import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/delete_confirm_dialog_widget.dart';
import 'package:lumen/features/home/controllers/home_controller.dart';
import 'package:lumen/features/home/widgets/home_section_header_widget.dart';
import 'package:lumen/features/projects/model/project_model.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class HomeRecentSection extends GetView<HomeController> {
  const HomeRecentSection({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<HomeController>(builder: (controller) {
      final projects = controller.recentProjects;

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          HomeSectionHeaderWidget(
            title: 'recent'.tr,
            trailing: Text(
              'projects_count'.trParams({'count': '${projects.length}'}),
              style: robotoRegular.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: Dimensions.fontSizeDefault - 1,
              ),
            ),
          ),
          const SizedBox(height: Dimensions.fontSizeSmall),
          if (projects.isEmpty)
            const _EmptyRecentState()
          else
            LayoutBuilder(
              builder: (context, constraints) {
                final isTablet = constraints.maxWidth >= 600;
                final maxItems = isTablet ? 10 : 6;
                final crossAxisCount = isTablet ? 5 : 3;
                final display = projects.take(maxItems).toList();

                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 0.85,
                  ),
                  itemCount: display.length,
                  itemBuilder: (_, index) => _RecentProjectItem(project: display[index]),
                );
              },
            ),
        ],
      );
    });
  }
}

class _EmptyRecentState extends StatelessWidget {
  const _EmptyRecentState();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 36),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.paddingSizeDefault - 1),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Column(
        children: [
          Icon(
            Icons.photo_library_outlined,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            size: Dimensions.paddingSizeExtraMoreLarge + 1,
          ),
          const SizedBox(height: 10),
          Text(
            'no_recent'.tr,
            style: robotoMedium.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: Dimensions.fontSizeDefault,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'pick_image'.tr,
            style: robotoRegular.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: Dimensions.fontSizeSmall,
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentProjectItem extends GetView<HomeController> {
  final ProjectModel project;

  const _RecentProjectItem({required this.project});

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final crossAxisCount = mq.size.width >= 600 ? 5.0 : 3.0;
    final cacheWidth = ((mq.size.width - Dimensions.paddingSizeLarge * 2 - 10.0 * (crossAxisCount - 1)) / crossAxisCount * mq.devicePixelRatio).round();

    return GestureDetector(
      onTap: () => controller.openProject(project.imagePath, project.name),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(Dimensions.fontSizeSmall),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.file(
              File(project.imagePath),
              fit: BoxFit.cover,
              cacheWidth: cacheWidth,
              errorBuilder: (_, __, ___) => Container(
                color: Theme.of(context).cardColor,
                child: Icon(
                  Icons.broken_image_outlined,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  size:
                      Dimensions.fontSizeOverLarge + Dimensions.radiusSmall - 1,
                ),
              ),
            ),
            Positioned(
              top: 6,
              left: 6,
              child: GestureDetector(
                onTap: () => DeleteConfirmDialog.show(
                  context,
                  onConfirm: () => controller.deleteProject(project.id, project),
                ),
                child: Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.45),
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  ),
                  child: const Icon(Icons.delete_outline, color: Colors.white, size: 14),
                ),
              ),
            ),

            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.transparent, Colors.black87],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Text(
                  project.name,
                  style: robotoMedium.copyWith(
                    color: Colors.white,
                    fontSize: Dimensions.fontSizeExtraSmall,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
