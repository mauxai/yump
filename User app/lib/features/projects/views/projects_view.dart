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
  const ProjectsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: ()async{
            Get.find<ProjectsController>().loadProjects(shouldUpdate: false);
          },
          child: Column(
            children: [
              const ProjectsTopBarWidget(),
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
        ),
      ),
    );
  }
}
