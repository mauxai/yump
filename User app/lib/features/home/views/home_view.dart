import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/home/widgets/home_action_cards_widget.dart';
import 'package:lumen/features/home/widgets/home_credits_card_widget.dart';
import 'package:lumen/features/home/widgets/home_gallery_section_widget.dart';
import 'package:lumen/features/home/widgets/home_projects_section_widget.dart';
import 'package:lumen/features/home/widgets/home_top_row_widget.dart';
import 'package:lumen/features/home/widgets/home_trending_prompts_widget.dart';
import 'package:lumen/features/notification/controllers/notification_controller.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/util/dimensions.dart';
import '../controllers/home_controller.dart';

class HomeView extends StatefulWidget {
  const HomeView({super.key});
  @override
  State<HomeView> createState() => _HomeViewState();
}
class _HomeViewState extends State<HomeView> {

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh:  () async {
            await Get.find<ProfileController>().fetchProfile();
            await Get.find<HomeController>().fetchSuggestions();
            await Get.find<ProjectsController>().loadProjects(shouldUpdate: false);
            await Get.find<NotificationController>().loadNotifications(showLoader: false);
          },
          child: GetBuilder<ProfileController>(
            builder: (profileController) {
              if (profileController.user == null) return const _HomeShimmer();

              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                    child: Column(
                      children: [
                        const SizedBox(height: Dimensions.fontSizeLarge),
                        HomeTopRow(
                          userName: profileController.user?.name ?? 'guest_user'.tr,
                          userPhoto: profileController.user?.avatar ?? '',
                          planName: profileController.user?.currentPlan?.name,
                        ),
                        const SizedBox(height: Dimensions.paddingSizeLarge),
                      ],
                    ),
                  ),
                 GetBuilder<HomeController>(builder: (homeController){
                   return  Expanded(
                     child: SingleChildScrollView(
                       padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                       child: Column(
                         crossAxisAlignment: CrossAxisAlignment.start,
                         children: [
                           HomeCreditsCard(
                             creditsLeft: (profileController.user?.creditsTotal ?? 0) - (profileController.user?.creditsUsed ?? 0),
                             totalCredits: profileController.user?.creditsTotal ?? 0,
                             purchasedAt: profileController.user?.currentPlan?.purchasedAt,
                           ),
                           const SizedBox(height: Dimensions.fontSizeLarge),
                           HomeActionCards(
                             onCameraTap: homeController.pickFromCamera,
                             onGalleryTap: homeController.pickFromGallery,
                           ),
                           const SizedBox(height: Dimensions.fontSizeOverLarge),
                           GetBuilder<HomeController>(
                             builder: (c) => HomeTrendingPrompts(
                               prompts: c.suggestions ?? [],
                               isLoading: c.suggestions == null,
                               onPromptTap: c.pickFromGalleryWithPrompt,
                             ),
                           ),
                           const SizedBox(height: Dimensions.fontSizeOverLarge),
                           const HomeProjectsSectionWidget(),
                           const HomeGallerySection(),
                           const SizedBox(height: 100),
                         ],
                       ),
                     ),
                   );
                 }),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _HomeShimmer extends StatefulWidget {
  const _HomeShimmer();

  @override
  State<_HomeShimmer> createState() => _HomeShimmerState();
}

class _HomeShimmerState extends State<_HomeShimmer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  late final Animation<double> _anim =
      Tween<double>(begin: -2, end: 2).animate(_ctrl);

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Widget _box(double height, {double? width, double radius = 12}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE0E0E0);
    final highlight =
        isDark ? const Color(0xFF48484A) : const Color(0xFFF5F5F5);

    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(radius),
          gradient: LinearGradient(
            begin: Alignment(_anim.value - 1, 0),
            end: Alignment(_anim.value, 0),
            colors: [base, highlight, base],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const horizontalPadding = Dimensions.paddingSizeLarge;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: horizontalPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Dimensions.fontSizeLarge),
          Row(children: [
            _box(44, width: 44, radius: Dimensions.radiusLarge - 3),
            const SizedBox(width: Dimensions.paddingSizeSmall),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _box(11, width: 72),
                    const SizedBox(height: 6),
                    _box(15, width: 110),
                  ]),
            ),
            _box(40, width: 40, radius: Dimensions.radiusLarge - 3),
          ]),
          const SizedBox(height: Dimensions.paddingSizeLarge),
          _box(114, radius: Dimensions.radiusLarge + 1),
          const SizedBox(height: Dimensions.fontSizeLarge),
          Row(children: [
            Expanded(child: _box(92, radius: Dimensions.radiusLarge)),
            const SizedBox(width: Dimensions.fontSizeSmall),
            Expanded(child: _box(92, radius: Dimensions.radiusLarge)),
          ]),
          const SizedBox(height: Dimensions.fontSizeOverLarge),
          _box(14, width: 130, radius: 6),
          const SizedBox(height: 14),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              _box(36, width: 108, radius: 20),
              const SizedBox(width: Dimensions.paddingSizeSmall),
              _box(36, width: 128, radius: 20),
              const SizedBox(width: Dimensions.paddingSizeSmall),
              _box(36, width: 96, radius: 20),
              const SizedBox(width: Dimensions.paddingSizeSmall),
              _box(36, width: 118, radius: 20),
            ]),
          ),
          const SizedBox(height: Dimensions.fontSizeOverLarge),
          _box(14, width: 90, radius: 6),
          const SizedBox(height: 14),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: Dimensions.fontSizeSmall,
            mainAxisSpacing: Dimensions.fontSizeSmall,
            childAspectRatio: 1,
            children: List.generate(
                4,
                (_) =>
                    _box(double.infinity, radius: Dimensions.radiusLarge - 3)),
          ),
          const SizedBox(height: 100),
        ],
      ),
    );
  }
}
