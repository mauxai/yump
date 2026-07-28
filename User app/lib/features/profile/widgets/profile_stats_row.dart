import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ProfileStatsRow extends StatelessWidget {
  final int credits;
  final int totalProjects;
  final int totalEdits;

  const ProfileStatsRow({
    super.key,
    required this.credits,
    required this.totalProjects,
    required this.totalEdits,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _ProfileStatCard(label: 'credits', value: '$credits')),
        const SizedBox(width: 10),
        Expanded(child: _ProfileStatCard(label: 'projects', value: '$totalProjects')),
        const SizedBox(width: 10),
        Expanded(child: _ProfileStatCard(label: 'edits', value: '$totalEdits')),
      ],
    );
  }
}

class _ProfileStatCard extends StatelessWidget {
  final String label;
  final String value;

  const _ProfileStatCard({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: robotoBold.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: 22,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label.tr,
            style: robotoRegular.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: Dimensions.fontSizeSmall,
            ),
          ),
        ],
      ),
    );
  }
}
