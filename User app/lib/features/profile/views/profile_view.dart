import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/profile/widgets/profile_account_section.dart';
import 'package:lumen/features/profile/widgets/profile_avatar_section.dart';
import 'package:lumen/features/profile/widgets/profile_plan_card.dart';
import 'package:lumen/features/profile/widgets/profile_stats_row.dart';
import 'package:lumen/features/profile/widgets/profile_top_bar.dart';
import 'package:lumen/util/dimensions.dart';
import '../controllers/profile_controller.dart';

class ProfileView extends StatelessWidget {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: GetBuilder<ProfileController>(builder: (controller) {
          return RefreshIndicator(
            onRefresh: () async {
              controller.fetchProfile();
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.fromLTRB(
                    Dimensions.paddingSizeLarge, 16,
                    Dimensions.paddingSizeLarge, 0,
                  ),
                  child: ProfileTopBar(),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 28),

                        ProfileAvatarSection(
                          userName: controller.user?.name ?? 'user'.tr,
                          userEmail: controller.user?.email ?? '',
                          userPhoto: controller.user?.avatar ?? '',
                        ),

                        const SizedBox(height: 24),

                        ProfileStatsRow(
                          credits: (controller.user?.creditsTotal ?? 0) - (controller.user?.creditsUsed ?? 0),
                          totalProjects: controller.user?.totalProject ?? 0,
                          totalEdits: controller.user?.totalEdit ?? 0,
                        ),

                        const SizedBox(height: 20),

                        ProfilePlanCard(plan: controller.user?.currentPlan, onTap: controller.goToUpgrade),

                        const SizedBox(height: 24),

                        const ProfileAccountSection(),

                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
