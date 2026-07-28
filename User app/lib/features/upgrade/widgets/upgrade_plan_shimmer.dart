import 'package:flutter/material.dart';
import 'package:lumen/common/widgets/shimmer_box.dart';

class UpgradePlanShimmer extends StatelessWidget {
  const UpgradePlanShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(children: List.generate(3, (_) => const _PlanCardSkeleton()));
  }
}

class _PlanCardSkeleton extends StatelessWidget {
  const _PlanCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
        color: Theme.of(context).cardColor,
      ),
      padding: const EdgeInsets.all(16),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            ShimmerBox(width: 110, height: 15, borderRadius: 4),
            Spacer(),
            ShimmerBox(width: 88, height: 28, borderRadius: 20),
          ]),

          SizedBox(height: 14),
          ShimmerBox(width: 90, height: 38, borderRadius: 6),

          SizedBox(height: 14),
          ShimmerBox(height: 48, borderRadius: 10),
        ],
      ),
    );
  }
}
