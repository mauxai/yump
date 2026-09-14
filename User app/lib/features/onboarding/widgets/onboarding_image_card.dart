import 'package:flutter/material.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class OnboardingImageCard extends StatelessWidget {
  final double width;
  final double height;
  final Color glowColor;
  final AlignmentGeometry gradientBegin;
  final AlignmentGeometry gradientEnd;
  final bool isCenter;

  const OnboardingImageCard({
    super.key,
    required this.width,
    required this.height,
    required this.glowColor,
    this.gradientBegin = Alignment.topCenter,
    this.gradientEnd = Alignment.bottomCenter,
    this.isCenter = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final cardBg = Theme.of(context).cardColor;

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(Dimensions.radiusExtraLarge),
        border: Border.all(
          color: isCenter
              ? AppColors.gradientStart.withValues(alpha: 0.5)
              : colorScheme.outline.withValues(alpha: 0.4),
          width: isCenter ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: glowColor.withValues(alpha: isCenter ? 0.35 : 0.15),
            blurRadius: 28,
            spreadRadius: 2,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background subtle ambient glow
          Positioned(
            top: -20,
            right: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [glowColor.withValues(alpha: 0.3), glowColor.withValues(alpha: 0)],
                ),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top header bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [AppColors.gradientStart, AppColors.gradientEnd],
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.auto_awesome, color: Colors.white, size: 12),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Yumpass AI',
                          style: robotoBold.copyWith(
                            fontSize: 11,
                            color: colorScheme.onSurface,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.gradientStart.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      ),
                      child: Text(
                        isCenter ? 'v${AppConstants.appVersion}' : 'AI Chat',
                        style: robotoMedium.copyWith(
                          color: AppColors.gradientStart,
                          fontSize: 9.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // User prompt bubble
                Align(
                  alignment: Alignment.centerRight,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.gradientStart, AppColors.gradientEnd],
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.chat_bubble_outline_rounded, color: Colors.white, size: 11),
                        const SizedBox(width: 5),
                        Text(
                          'Ask anything...',
                          style: robotoMedium.copyWith(
                            color: Colors.white,
                            fontSize: 10.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Assistant response bubble
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: colorScheme.outline.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.bolt_rounded, color: AppColors.gradientStart, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            'Instant Answers & Docs',
                            style: robotoMedium.copyWith(
                              fontSize: 10,
                              color: AppColors.gradientStart,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Container(
                        height: 5,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        height: 5,
                        width: 110,
                        decoration: BoxDecoration(
                          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // Bottom feature tag chips
                const Row(
                  children: [
                    _FeatureMiniPill(
                      label: 'Citizen Services',
                      color: Color(0xFF34D399),
                    ),
                    SizedBox(width: 4),
                    _FeatureMiniPill(
                      label: 'Creative',
                      color: AppColors.gradientEnd,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureMiniPill extends StatelessWidget {
  final String label;
  final Color color;

  const _FeatureMiniPill({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        label,
        style: robotoMedium.copyWith(
          fontSize: 8.5,
          color: color,
        ),
      ),
    );
  }
}
