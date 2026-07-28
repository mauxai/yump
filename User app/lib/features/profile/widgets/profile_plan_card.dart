import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/util/styles.dart';

class ProfilePlanCard extends StatelessWidget {
  final Plan? plan;
  final VoidCallback onTap;

  const ProfilePlanCard({super.key, required this.plan, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              plan != null ? Icons.workspace_premium : Icons.bolt,
              color: Colors.white,
              size: 24,
            ),
          ),

          const SizedBox(width: 12),

          Expanded(child: plan != null ? _PlanInfo(plan: plan!) : const _NoPlanInfo()),

          const Icon(Icons.arrow_forward_ios, color: Colors.white, size: 16),
        ]),
      ),
    );
  }
}

class _PlanInfo extends StatelessWidget {
  final Plan plan;
  const _PlanInfo({required this.plan});

  String get _formattedDate {
    final raw = plan.purchasedAt ?? '';
    return raw.length >= 10 ? raw.substring(0, 10) : raw;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          plan.name ?? '',
          style: robotoBold.copyWith(color: Colors.white, fontSize: 15),
        ),

        Text(
          'plan_credits'.trParams({'credits': '${plan.credits ?? 0}'}),
          style: robotoRegular.copyWith(color: Colors.white.withValues(alpha: 0.85), fontSize: 12),
        ),

        Text(
          'purchased_on'.trParams({'date': _formattedDate}),
          style: robotoRegular.copyWith(color: Colors.white.withValues(alpha: 0.7), fontSize: 11),
        ),
      ],
    );
  }
}

class _NoPlanInfo extends StatelessWidget {
  const _NoPlanInfo();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'no_plan_available'.tr,
          style: robotoBold.copyWith(color: Colors.white, fontSize: 15),
        ),

        Text(
          'purchase_plan'.tr,
          style: robotoRegular.copyWith(color: Colors.white.withValues(alpha: 0.8), fontSize: 12),
        ),
      ],
    );
  }
}
