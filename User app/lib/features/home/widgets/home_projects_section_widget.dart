import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/delete_confirm_dialog_widget.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/features/home/widgets/home_section_header_widget.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/features/projects/model/project_paginated_response_model.dart';
import 'package:lumen/features/projects/widgets/projects_thumbnail_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class HomeProjectsSectionWidget extends StatelessWidget {
  const HomeProjectsSectionWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final isTablet = MediaQuery.of(context).size.width >= 600;
    final maxItems = isTablet ? 10 : 6;
    final crossAxisCount = isTablet ? 5 : 3;

    return GetBuilder<ProjectsController>(builder: (controller) {
      final projects = controller.apiProjects;
      final hasMore = projects != null && projects.length > maxItems;

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          HomeSectionHeaderWidget(
            title: 'recent_projects'.tr,
            trailing: projects == null
                ? null
                : hasMore
                    ? GestureDetector(
                        onTap: () => Get.find<DashboardController>().changeTab(1),
                        child: Text(
                          'see_all'.tr,
                          style: robotoMedium.copyWith(
                            color: Theme.of(context).colorScheme.primary,
                            fontSize: Dimensions.fontSizeDefault - 1,
                          ),
                        ),
                      )
                    : Text(
                        projects.length == 1
                            ? 'projects_count_single'.trParams({'count': '1'})
                            : 'projects_count_plural'.trParams({'count': '${projects.length}'}),
                        style: robotoRegular.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: Dimensions.fontSizeDefault - 1,
                        ),
                      ),
          ),

          const SizedBox(height: Dimensions.fontSizeSmall),

          if (projects == null)
            const _HomeProjectsShimmer()
          else if (projects.isEmpty)
            const _EmptyProjectsState()
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: crossAxisCount,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.85,
              ),
              itemCount: projects.take(maxItems).length,
              itemBuilder: (_, index) => _ProjectGridItem(project: projects[index]),
            ),
        ],
      );
    });
  }
}

class _ProjectGridItem extends GetView<ProjectsController> {
  final Projects project;

  const _ProjectGridItem({required this.project});

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final crossAxisCount = mq.size.width >= 600 ? 5.0 : 3.0;
    final cacheWidth = ((mq.size.width - Dimensions.paddingSizeLarge * 2 - 10.0 * (crossAxisCount - 1)) / crossAxisCount * mq.devicePixelRatio).round();

    return GestureDetector(
      onTap: () => controller.openProject(project.thumbnailUrl ?? '', project.name ?? '', projectId: project.id),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(Dimensions.fontSizeSmall),
        child: Stack(
          fit: StackFit.expand,
          children: [
            ProjectsThumbnailWidget(
              imageUrl: project.thumbnailUrl,
              borderRadius: BorderRadius.circular(Dimensions.fontSizeSmall),
              cacheWidth: cacheWidth,
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
                  project.name ?? '',
                  style: robotoMedium.copyWith(
                    color: Colors.white,
                    fontSize: Dimensions.fontSizeExtraSmall,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),

            Positioned(
              top: 6,
              left: 6,
              child: GestureDetector(
                onTap: () => DeleteConfirmDialog.show(
                  context,
                  onConfirm: () => controller.deleteProject(project.id ?? ''),
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

            if ((project.editCount ?? 0) > 0)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.45),
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.layers_outlined, color: Colors.white, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      '${project.editCount}',
                      style: robotoMedium.copyWith(color: Colors.white, fontSize: Dimensions.fontSizeExtraSmall),
                    ),
                  ]),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _EmptyProjectsState extends StatelessWidget {
  const _EmptyProjectsState();

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

class _HomeProjectsShimmer extends StatefulWidget {
  const _HomeProjectsShimmer();

  @override
  State<_HomeProjectsShimmer> createState() => _HomeProjectsShimmerState();
}

class _HomeProjectsShimmerState extends State<_HomeProjectsShimmer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  late final Animation<double> _anim = Tween<double>(begin: -2, end: 2).animate(_ctrl);

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Widget _box({double radius = 8}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE0E0E0);
    final highlight = isDark ? const Color(0xFF48484A) : const Color(0xFFF5F5F5);

    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(radius),
          gradient: LinearGradient(
            begin: Alignment(_anim.value - 1, 0),
            end: Alignment(_anim.value, 0),
            colors: [base, highlight, base],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 0.85,
      children: List.generate(6, (_) => _box(radius: Dimensions.fontSizeSmall)),
    );
  }
}
