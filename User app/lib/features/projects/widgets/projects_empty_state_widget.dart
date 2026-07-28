import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ProjectsEmptyStateWidget extends StatelessWidget {
  const ProjectsEmptyStateWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.photo_library_outlined,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            size: 52,
          ),
          const SizedBox(height: 14),
          Text(
            'projects_empty_title'.tr,
            style: robotoMedium.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: Dimensions.fontSizeLarge,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'projects_empty_subtitle'.tr,
            style: robotoRegular.copyWith(
              color: Theme.of(context)
                  .colorScheme
                  .onSurfaceVariant
                  .withValues(alpha: 0.8),
              fontSize: Dimensions.fontSizeSmall + 1,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
