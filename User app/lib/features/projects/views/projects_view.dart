import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/projects/widgets/projects_empty_state_widget.dart';
import 'package:lumen/features/projects/widgets/projects_grid_widget.dart';
import 'package:lumen/features/projects/widgets/projects_list_widget.dart';
import 'package:lumen/features/projects/widgets/projects_shimmer_widget.dart';
import 'package:lumen/features/projects/widgets/projects_top_bar_widget.dart';
import 'package:lumen/util/dimensions.dart';
import '../controllers/projects_controller.dart';

class ProjectsView extends GetView<ProjectsController> {
  final bool showHeader;
  const ProjectsView({super.key, this.showHeader = true});

  @override
  Widget build(BuildContext context) {
    final content = RefreshIndicator(
      onRefresh: () async {
        Get.find<ProjectsController>().loadProjects(shouldUpdate: false);
      },
      child: Column(
        children: [
          if (showHeader) const ProjectsTopBarWidget(),
          Expanded(
            child: GetBuilder<ProjectsController>(builder: (controller) {
              final projects = controller.apiProjects;

              if (projects == null) return const ProjectsShimmerWidget();

              if (projects.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                  child: ProjectsEmptyStateWidget(),
                );
              }

              if (controller.isGridView) return ProjectsGridWidget(projects: projects);

              return ProjectsListWidget(projects: projects);
            }),
          ),
        ],
      ),
    );

    if (!showHeader) return content;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(child: content),
    );
  }
}
