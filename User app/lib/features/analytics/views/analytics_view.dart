import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:lumen/common/widgets/custom_appbar_widget.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/analytics/controllers/analytics_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class AnalyticsView extends GetView<AnalyticsController> {
  const AnalyticsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: CustomAppBar(
        title: 'usage_analytics'.tr,
        isBackButtonExist: true,
      ),
      body: GetBuilder<AnalyticsController>(
        builder: (ctrl) {
          if (ctrl.isLoading && ctrl.analytics == null) {
            return const Center(child: CircularProgressIndicator(strokeWidth: 2));
          }

          final a = ctrl.analytics;
          if (a == null) {
            return Center(
              child: Text(
                'no_analytics_data'.tr,
                style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: ctrl.loadAnalytics,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Stat Cards Grid
                  Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          title: 'credits_used'.tr,
                          value: '${a.creditsUsed}',
                          subtitle: '${a.creditsRemaining} ${'remaining'.tr}',
                          icon: Icons.stars_rounded,
                          color: AppColors.gradientStart,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          title: 'total_edits'.tr,
                          value: '${a.totalEdits}',
                          subtitle: '${a.totalProjects} ${'projects'.tr}',
                          icon: Icons.image_rounded,
                          color: AppColors.gradientEnd,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Model Usage
                  Text('edits_by_model'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
                  const SizedBox(height: 12),
                  if (a.modelUsage.isEmpty)
                    Text('no_model_data'.tr, style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant))
                  else
                    ...a.modelUsage.map((m) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                          border: Border.all(color: Theme.of(context).colorScheme.outline),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: const BoxDecoration(color: AppColors.gradientStart, shape: BoxShape.circle),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(m.label, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall)),
                            ),
                            Text(
                              '${m.edits} ${'edits'.tr} (${m.credits} ${'credits'.tr})',
                              style: robotoRegular.copyWith(
                                fontSize: Dimensions.fontSizeExtraSmall,
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  const SizedBox(height: 24),

                  // Recent Activity
                  Text('recent_activity'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
                  const SizedBox(height: 12),
                  if (a.recentActivity.isEmpty)
                    Text('no_activity_found'.tr, style: robotoRegular.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant))
                  else
                    ...a.recentActivity.map((act) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                          border: Border.all(color: Theme.of(context).colorScheme.outline),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              act.type == 'credit_purchased' ? Icons.payment_rounded : Icons.auto_fix_normal_rounded,
                              size: 18,
                              color: AppColors.gradientStart,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(act.description, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                                  const SizedBox(height: 2),
                                  Text(
                                    DateFormat('MMM dd, yyyy • hh:mm a').format(act.createdAt),
                                    style: robotoRegular.copyWith(
                                      fontSize: 10,
                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: robotoRegular.copyWith(
                  fontSize: Dimensions.fontSizeSmall,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              Icon(icon, color: color, size: 20),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: robotoBold.copyWith(fontSize: 24),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: robotoRegular.copyWith(
              fontSize: Dimensions.fontSizeExtraSmall,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
