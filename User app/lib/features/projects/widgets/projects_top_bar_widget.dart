import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/features/projects/widgets/projects_view_toggle_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ProjectsTopBarWidget extends GetView<ProjectsController> {
  const ProjectsTopBarWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Dimensions.paddingSizeLarge,
        Dimensions.fontSizeLarge,
        Dimensions.paddingSizeLarge,
        Dimensions.fontSizeSmall,
      ),
      child: Row(children: [
        Expanded(
          child: Text(
            'projects'.tr,
            style: robotoBold.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: Dimensions.fontSizeOverLarge,
            ),
          ),
        ),
        GetBuilder<ProjectsController>(
          builder: (controller) => ProjectsViewToggleWidget(
            isGrid: controller.isGridView,
            onToggle: controller.toggleView,
          ),
        ),
      ]),
    );
  }
}
