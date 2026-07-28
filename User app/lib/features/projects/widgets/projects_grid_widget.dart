import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/features/projects/model/project_paginated_response_model.dart';
import 'package:lumen/features/projects/widgets/projects_grid_item_widget.dart';
import 'package:lumen/util/dimensions.dart';

class ProjectsGridWidget extends GetView<ProjectsController> {
  final List<Projects> projects;

  const ProjectsGridWidget({super.key, required this.projects});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isTablet = constraints.maxWidth >= 600;
        final crossAxisCount = isTablet ? 4 : 3;

        return NotificationListener<ScrollNotification>(
          onNotification: (scroll) {
            if (scroll.metrics.pixels >= scroll.metrics.maxScrollExtent - 200) {
              controller.loadMore();
            }
            return false;
          },
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (_, index) => ProjectsGridItemWidget(
                      project: projects[index],
                      onTap: () => controller.openProject(
                        projects[index].thumbnailUrl ?? '',
                        projects[index].name ?? '',
                        projectId: projects[index].id,
                      ),
                      onDelete: () => controller.deleteProject(projects[index].id ?? ''),
                    ),
                    childCount: projects.length,
                  ),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: Dimensions.paddingSizeSmall,
                    mainAxisSpacing: Dimensions.paddingSizeSmall,
                    childAspectRatio: 0.85,
                  ),
                ),
              ),

              if (controller.isLoadingMore)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: Dimensions.paddingSizeLarge),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: Dimensions.paddingSizeExtraLarge)),
            ],
          ),
        );
      },
    );
  }
}
