import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/helper/date_converter.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class HomeCreditsCard extends StatelessWidget {
  final int creditsLeft;
  final int totalCredits;
  final String? purchasedAt;

  const HomeCreditsCard({
    super.key,
    required this.creditsLeft,
    required this.totalCredits,
    this.purchasedAt,
  });


  @override
  Widget build(BuildContext context) {
    final progress =
        totalCredits == 0 ? 0.0 : (creditsLeft / totalCredits).clamp(0.0, 1.0);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
      decoration: BoxDecoration(
        gradient: AppColors.mainGradient,
        borderRadius: BorderRadius.circular(Dimensions.radiusLarge + 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'credits_left'.tr,
            style: robotoMedium.copyWith(
              color: Colors.white,
              fontSize: Dimensions.fontSizeSmall,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '$creditsLeft / $totalCredits',
            style: robotoBold.copyWith(
              color: Colors.white,
              fontSize:
                  Dimensions.fontSizeOverLarge + Dimensions.paddingSizeEight,
            ),
          ),
          const SizedBox(height: Dimensions.fontSizeSmall),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.white.withValues(alpha: 0.3),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
              minHeight: 4,
            ),
          ),
          const SizedBox(height: Dimensions.fontSizeSmall),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (purchasedAt != null && purchasedAt!.isNotEmpty)
                Text(
                  '${'renews'.tr} · ${DateConverter.formatDateString(purchasedAt)}',
                  style: robotoRegular.copyWith(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: Dimensions.fontSizeDefault,
                  ),
                )
              else
                const SizedBox.shrink(),
              GestureDetector(
                onTap: () => Get.toNamed(RouteHelper.getUpgradeRoute()),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.6)),
                    borderRadius:
                        BorderRadius.circular(Dimensions.radiusExtraLarge),
                  ),
                  child: Text(
                    'upgrade'.tr,
                    style: robotoMedium.copyWith(
                      color: Colors.white,
                      fontSize: Dimensions.fontSizeSmall,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
