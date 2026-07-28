import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/delete_confirm_dialog_widget.dart';
import 'package:lumen/features/projects/model/project_paginated_response_model.dart';
import 'package:lumen/features/projects/widgets/projects_thumbnail_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ProjectsGridItemWidget extends StatelessWidget {
  final Projects project;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const ProjectsGridItemWidget({
    super.key,
    required this.project,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final crossAxisCount = mq.size.width >= 600 ? 4.0 : 3.0;
    final cacheWidth = ((mq.size.width - Dimensions.paddingSizeLarge * 2 - Dimensions.paddingSizeSmall * (crossAxisCount - 1)) / crossAxisCount * mq.devicePixelRatio).round();

    return GestureDetector(
      onTap: onTap,
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
                borderRadius: BorderRadius.vertical(
                  bottom: Radius.circular(Dimensions.fontSizeSmall),
                ),
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
              onTap: () => DeleteConfirmDialog.show(Get.context!, onConfirm: onDelete),
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
    );
  }
}
