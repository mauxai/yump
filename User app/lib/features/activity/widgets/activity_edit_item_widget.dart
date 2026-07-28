import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_image.dart';
import 'package:lumen/features/activity/models/paginated_activity_model.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ActivityEditItemWidget extends StatelessWidget {
  final Edits edit;
  const ActivityEditItemWidget({super.key, required this.edit});

  static String _timeAgo(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  static String _clockTime(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return '';
    final h = dt.hour;
    final m = dt.minute.toString().padLeft(2, '0');
    final period = h >= 12 ? 'PM' : 'AM';
    final hour = h % 12 == 0 ? 12 : h % 12;
    return '$hour:$m $period';
  }

  @override
  Widget build(BuildContext context) {
    final imageUrl = edit.image?.isNotEmpty == true
        ? (edit.image!.startsWith('http') ? edit.image! : '${AppConstants.baseUrl}${edit.image}')
        : null;

    return GestureDetector(
      onTap: () => Get.toNamed(RouteHelper.getEditorRoute(
        imagePath: imageUrl ?? '',
        projectName: edit.project?.name ?? '',
        projectId: edit.project?.id,
        initialPrompt: edit.prompt,
      )),
      child: Container(
      padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Row(children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(Dimensions.radiusSmall + 3),
          child: imageUrl != null
              ? CustomImage(image: imageUrl, width: 52, height: 52, fit: BoxFit.cover)
              : Container(
                  width: 52, height: 52,
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: Icon(Icons.image_outlined,
                      color: Theme.of(context).colorScheme.onSurfaceVariant, size: 22),
                ),
        ),

        const SizedBox(width: Dimensions.paddingSizeSmall),

        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              edit.prompt ?? '',
              style: robotoMedium.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: Dimensions.fontSizeDefault,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),

            const SizedBox(height: 3),

            Row(children: [
              Icon(Icons.folder_outlined,
                  size: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
              const SizedBox(width: 3),
              Expanded(
                child: Text(
                  edit.project?.name ?? '',
                  style: robotoRegular.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: Dimensions.fontSizeSmall,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ]),
          ]),
        ),

        const SizedBox(width: Dimensions.paddingSizeEight),

        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(
            _timeAgo(edit.createdAt),
            style: robotoRegular.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: Dimensions.fontSizeExtraSmall,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            _clockTime(edit.createdAt),
            style: robotoRegular.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: Dimensions.fontSizeExtraSmall,
            ),
          ),
        ]),
      ]),
      ),
    );
  }
}
