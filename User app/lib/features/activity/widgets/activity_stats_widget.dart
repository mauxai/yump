import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/activity/models/paginated_activity_model.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ActivityStatsWidget extends StatelessWidget {
  final Stats? stats;
  const ActivityStatsWidget({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    final cards = [
      _StatCard(icon: Icons.bolt_rounded, iconColor: AppColors.gradientStart,
          value: stats?.totalEdits, label: 'total_edits'.tr),
      _StatCard(icon: Icons.folder_outlined, iconColor: AppColors.gradientStart,
          value: stats?.projectsEdited, label: 'projects_edited'.tr),
      _StatCard(icon: null, iconColor: null,
          value: stats?.pageCount, label: 'this_page'.tr),
    ];

    return Row(children: [
      Expanded(child: cards[0]),
      const SizedBox(width: Dimensions.paddingSizeEight),
      Expanded(child: cards[1]),
      const SizedBox(width: Dimensions.paddingSizeEight),
      Expanded(child: cards[2]),
    ]);
  }
}

class _StatCard extends StatelessWidget {
  final IconData? icon;
  final Color? iconColor;
  final int? value;
  final String label;

  const _StatCard({required this.icon, required this.iconColor, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeDefault),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[
          Container(
            padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
            decoration: BoxDecoration(
              color: iconColor!.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
            ),
            child: Icon(icon, color: iconColor, size: 16),
          ),
          const SizedBox(width: Dimensions.paddingSizeEight),
        ],

        Flexible(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              '${value ?? 0}',
              style: robotoBold.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: Dimensions.fontSizeExtraLarge + 4,
              ),
            ),

            Text(
              label,
              style: robotoRegular.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: Dimensions.fontSizeExtraSmall,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ]),
        ),
      ]),
    );
  }
}
