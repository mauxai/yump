import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/features/projects/model/project_paginated_response_model.dart';
import 'package:lumen/features/projects/widgets/projects_list_item_widget.dart';
import 'package:lumen/util/dimensions.dart';

class ProjectsListWidget extends GetView<ProjectsController> {
  final List<Projects> projects;

  const ProjectsListWidget({super.key, required this.projects});

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (scroll) {
        if (scroll.metrics.pixels >= scroll.metrics.maxScrollExtent - 200) {
          controller.loadMore();
        }
        return false;
      },
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(
          Dimensions.paddingSizeLarge, 0,
          Dimensions.paddingSizeLarge, Dimensions.paddingSizeExtraLarge,
        ),
        itemCount: projects.length + (controller.isLoadingMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: Dimensions.paddingSizeSmall),
        itemBuilder: (_, index) {
          if (index == projects.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: Dimensions.paddingSizeLarge),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return ProjectsListItemWidget(
            project: projects[index],
            onTap: () => controller.openProject(
              projects[index].thumbnailUrl ?? '',
              projects[index].name ?? '',
              projectId: projects[index].id,
            ),
            onDelete: () => controller.deleteProject(projects[index].id ?? ''),
          );
        },
      ),
    );
  }
}
