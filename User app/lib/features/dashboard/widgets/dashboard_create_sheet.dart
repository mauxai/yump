import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/chat/controllers/chat_controller.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/features/home/controllers/home_controller.dart';
import 'package:lumen/features/video_studio/controllers/video_editor_controller.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class DashboardCreateSheet extends StatefulWidget {
  const DashboardCreateSheet({super.key});

  @override
  State<DashboardCreateSheet> createState() => _DashboardCreateSheetState();
}

class _DashboardCreateSheetState extends State<DashboardCreateSheet> {
  bool _showImageSources = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(Dimensions.radiusLarge)),
      ),
      child: SafeArea(
        child: AnimatedSize(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (!_showImageSources) ...[
                Text('create_new'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
                const SizedBox(height: 20),

                // Primary Action: New Chat
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      Navigator.pop(context);
                      Get.find<DashboardController>().changeTab(0);
                      Get.find<ChatController>().startNewChat();
                    },
                    borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.gradientStart, AppColors.gradientEnd],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.gradientStart.withValues(alpha: 0.25),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.add_comment_rounded, color: Colors.white, size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'new_chat'.tr,
                                  style: robotoBold.copyWith(
                                    color: Colors.white,
                                    fontSize: Dimensions.fontSizeDefault + 1,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'new_chat_desc'.tr,
                                  style: robotoRegular.copyWith(
                                    color: Colors.white.withValues(alpha: 0.85),
                                    fontSize: Dimensions.fontSizeSmall,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 16),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                Row(
                  children: [
                    Expanded(
                      child: _CreateOptionCard(
                        icon: Icons.auto_awesome_rounded,
                        title: 'generate_image'.tr.isNotEmpty ? 'generate_image'.tr : 'Generate Image',
                        subtitle: 'from_text_prompt'.tr.isNotEmpty ? 'from_text_prompt'.tr : 'From prompt',
                        color: AppColors.gradientStart,
                        onTap: () {
                          Navigator.pop(context);
                          Get.toNamed(RouteHelper.getImageStudioRoute());
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _CreateOptionCard(
                        icon: Icons.image_rounded,
                        title: 'edit_image'.tr,
                        subtitle: 'from_camera_gallery'.tr,
                        color: Colors.blueAccent,
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() {
                            _showImageSources = true;
                          });
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: _CreateOptionCard(
                        icon: Icons.videocam_rounded,
                        title: 'create_video'.tr,
                        subtitle: 'text_or_image_video'.tr,
                        color: AppColors.gradientEnd,
                        onTap: () {
                          Navigator.pop(context);
                          Get.toNamed(RouteHelper.getVideoStudioRoute());
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _CreateOptionCard(
                        icon: Icons.movie_creation_outlined,
                        title: 'edit_video'.tr,
                        subtitle: 'timeline_music_captions'.tr,
                        color: Colors.deepPurpleAccent,
                        onTap: () {
                          Navigator.pop(context);
                          if (Get.isRegistered<VideoEditorController>()) {
                            Get.find<VideoEditorController>().resetEditor();
                          }
                          Get.toNamed(RouteHelper.getVideoEditorRoute());
                        },
                      ),
                    ),
                  ],
                ),
              ] else ...[
                // Image Source Picker (Camera / Gallery)
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _showImageSources = false;
                        });
                      },
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'edit_image'.tr.isNotEmpty ? 'edit_image'.tr : 'Edit Image',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeLarge,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'pick_image'.tr.isNotEmpty ? 'pick_image'.tr : 'Choose image source to begin editing',
                    style: robotoRegular.copyWith(
                      fontSize: Dimensions.fontSizeSmall,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: _SourceOptionTile(
                        icon: Icons.camera_alt_rounded,
                        title: 'camera'.tr,
                        subtitle: 'take_photo'.tr.isNotEmpty ? 'take_photo'.tr : 'Take photo',
                        gradient: const LinearGradient(
                          colors: [Color(0xFF06B6D4), Color(0xFF3B82F6)],
                        ),
                        onTap: () {
                          Navigator.pop(context);
                          Get.find<HomeController>().pickFromCamera();
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _SourceOptionTile(
                        icon: Icons.photo_library_rounded,
                        title: 'gallery'.tr,
                        subtitle: 'from_gallery'.tr.isNotEmpty ? 'from_gallery'.tr : 'From gallery',
                        gradient: AppColors.mainGradient,
                        onTap: () {
                          Navigator.pop(context);
                          Get.find<HomeController>().pickFromGallery();
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
              ],
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
  final String? subtitle;
  final Gradient gradient;
  final VoidCallback onTap;

  const _SourceOptionTile({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          border: Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                gradient: gradient,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: robotoBold.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: 14,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(
                subtitle!,
                style: robotoRegular.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 11,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _CreateOptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _CreateOptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          border: Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 12),
            Text(title, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault), textAlign: TextAlign.center),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeExtraSmall, color: Theme.of(context).colorScheme.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
