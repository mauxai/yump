import 'package:flutter/material.dart';
import 'package:lumen/common/widgets/shimmer_box.dart';
import 'package:lumen/util/dimensions.dart';

class NotificationListShimmer extends StatelessWidget {
  const NotificationListShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(
        Dimensions.paddingSizeLarge,
        Dimensions.paddingSizeEight,
        Dimensions.paddingSizeLarge,
        Dimensions.paddingSizeExtraLarge,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => Container(
        margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
        padding: const EdgeInsets.all(Dimensions.paddingSizeSmall + 2),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge + 1),
          border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5)),
        ),
        child: const Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ShimmerBox(width: 56, height: 56, borderRadius: Dimensions.radiusDefault + 2),
          SizedBox(width: Dimensions.paddingSizeSmall + 2),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              ShimmerBox(height: 12, width: 180, borderRadius: 4),
              SizedBox(height: 8),
              ShimmerBox(height: 10, borderRadius: 4),
              SizedBox(height: 6),
              ShimmerBox(height: 10, width: 220, borderRadius: 4),
              SizedBox(height: 10),
              ShimmerBox(height: 10, width: 60, borderRadius: 4),
            ]),
          ),
        ]),
      ),
    );
  }
}
