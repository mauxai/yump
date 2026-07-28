import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/delete_confirm_dialog_widget.dart';
import 'package:lumen/features/projects/model/project_paginated_response_model.dart';
import 'package:lumen/features/projects/widgets/projects_thumbnail_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ProjectsListItemWidget extends StatelessWidget {
  final Projects project;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const ProjectsListItemWidget({
    super.key,
    required this.project,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final editCount = project.editCount ?? 0;
    final cacheSize = (76 * MediaQuery.of(context).devicePixelRatio).round();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 76,
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: Row(children: [
          SizedBox(
            width: 76,
            height: 76,
            child: ProjectsThumbnailWidget(
              imageUrl: project.thumbnailUrl,
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(13)),
              iconSize: 24,
              cacheWidth: cacheSize,
              cacheHeight: cacheSize,
            ),
          ),

          const SizedBox(width: 14),

          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  project.name ?? '',
                  style: robotoMedium.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: Dimensions.fontSizeDefault,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(children: [
                  Text(
                    _formatDate(project.createdAt),
                    style: robotoRegular.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontSize: Dimensions.fontSizeSmall,
                    ),
                  ),

                  if (editCount > 0) ...[
                    const SizedBox(width: Dimensions.paddingSizeEight),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                      ),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.layers_outlined, color: Theme.of(context).colorScheme.onSurfaceVariant, size: 12),
                        const SizedBox(width: 3),
                        Text(
                          '$editCount',
                          style: robotoMedium.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                            fontSize: Dimensions.fontSizeExtraSmall,
                          ),
                        ),
                      ]),
                    ),
                  ],
                ]),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              GestureDetector(
                onTap: () => DeleteConfirmDialog.show(context, onConfirm: onDelete),
                child: Padding(
                  padding: const EdgeInsets.all(6),
                  child: Icon(
                    Icons.delete_outline,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    size: Dimensions.fontSizeLarge,
                  ),
                ),
              ),

              Icon(
                Icons.chevron_right,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                size: Dimensions.paddingSizeLarge,
              ),
            ]),
          ),
        ]),
      ),
    );
  }

  String _formatDate(String? createdAt) {
    if (createdAt == null) return '';
    final dateTime = DateTime.tryParse(createdAt);
    if (dateTime == null) return createdAt;

    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) return 'today'.tr;
    if (difference.inDays == 1) return 'yesterday'.tr;
    if (difference.inDays < 7) return 'days_ago'.trParams({'count': '${difference.inDays}'});

    return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
  }
}
