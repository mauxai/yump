import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class HomeActionCards extends StatelessWidget {
  final VoidCallback onCameraTap;
  final VoidCallback onGalleryTap;

  const HomeActionCards({
    super.key,
    required this.onCameraTap,
    required this.onGalleryTap,
  });

  void _showPhotoSourceSheet(BuildContext context) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF181A26) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(
              color: isDark ? const Color(0xFF26283B) : const Color(0xFFE5E7EB),
              width: 1,
            ),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'edit_image'.tr.isNotEmpty ? 'edit_image'.tr : 'Edit Image',
                  style: robotoBold.copyWith(
                    color: Theme.of(ctx).colorScheme.onSurface,
                    fontSize: Dimensions.fontSizeLarge,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Choose image source to begin editing',
                  style: robotoRegular.copyWith(
                    color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                    fontSize: Dimensions.fontSizeSmall,
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: _SourceOptionTile(
                        icon: Icons.camera_alt_rounded,
                        title: 'camera'.tr,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF06B6D4), Color(0xFF3B82F6)],
                        ),
                        onTap: () {
                          Navigator.pop(ctx);
                          onCameraTap();
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _SourceOptionTile(
                        icon: Icons.photo_library_rounded,
                        title: 'upload'.tr,
                        gradient: AppColors.mainGradient,
                        onTap: () {
                          Navigator.pop(ctx);
                          onGalleryTap();
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StudioActionCard(
                iconData: Icons.forum_rounded,
                title: 'ai_chat'.tr.isNotEmpty ? 'ai_chat'.tr : 'AI Chat',
                subtitle: 'Multimodal assistant',
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                onTap: () {
                  HapticFeedback.lightImpact();
                  Get.find<DashboardController>().changeTab(0);
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StudioActionCard(
                iconData: Icons.auto_awesome_rounded,
                title: 'generate_image'.tr.isNotEmpty ? 'generate_image'.tr : 'Text to Image',
                subtitle: 'AI Studio generator',
                gradient: const LinearGradient(
                  colors: [Color(0xFFFF5B79), Color(0xFFE066C0)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                onTap: () {
                  HapticFeedback.lightImpact();
                  Get.toNamed(RouteHelper.getImageStudioRoute());
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _StudioActionCard(
                iconData: Icons.camera_alt_rounded,
                title: 'edit_image'.tr.isNotEmpty ? 'edit_image'.tr : 'Photo Editor',
                subtitle: 'Camera & Gallery',
                gradient: const LinearGradient(
                  colors: [Color(0xFF06B6D4), Color(0xFF3B82F6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                onTap: () => _showPhotoSourceSheet(context),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StudioActionCard(
                iconData: Icons.videocam_rounded,
                title: 'video_studio'.tr.isNotEmpty ? 'video_studio'.tr : 'Video Studio',
                subtitle: 'AI video generation',
                gradient: const LinearGradient(
                  colors: [Color(0xFFF59E0B), Color(0xFFEF4444)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                onTap: () {
                  HapticFeedback.lightImpact();
                  Get.toNamed(RouteHelper.getVideoStudioRoute());
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StudioActionCard extends StatefulWidget {
  final IconData iconData;
  final String title;
  final String subtitle;
  final Gradient gradient;
  final VoidCallback onTap;

  const _StudioActionCard({
    required this.iconData,
    required this.title,
    required this.subtitle,
    required this.gradient,
    required this.onTap,
  });

  @override
  State<_StudioActionCard> createState() => _StudioActionCardState();
}

class _StudioActionCardState extends State<_StudioActionCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _isPressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF141620) : Colors.white,
            borderRadius: BorderRadius.circular(Dimensions.radiusCard),
            border: Border.all(
              color: isDark ? const Color(0xFF26283B) : const Color(0xFFE5E7EB),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  gradient: widget.gradient,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: widget.gradient.colors.first.withValues(alpha: 0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  widget.iconData,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                widget.title,
                style: robotoBold.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontSize: 14,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                widget.subtitle,
                style: robotoRegular.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 11,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SourceOptionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Gradient gradient;
  final VoidCallback onTap;

  const _SourceOptionTile({
    required this.icon,
    required this.title,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          border: Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: gradient,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: robotoMedium.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
