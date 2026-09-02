import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ProfileAccountSection extends GetView<ProfileController> {
  const ProfileAccountSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'account'.tr,
          style: robotoMedium.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            fontSize: Dimensions.fontSizeSmall,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Theme.of(context).colorScheme.outline),
          ),
          child: Column(
            children: [
              _ProfileAccountTile(
                icon: Icons.person_outline,
                title: 'edit_profile'.tr,
                onTap: () => Get.toNamed(RouteHelper.getEditProfileRoute()),
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.lock_outline_rounded,
                title: 'change_password'.tr,
                onTap: () => _showChangePasswordDialog(context),
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.email_outlined,
                title: 'change_email'.tr,
                onTap: () => _showChangeEmailDialog(context),
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.insights_rounded,
                title: 'usage_analytics'.tr,
                onTap: () => Get.toNamed(RouteHelper.getAnalyticsRoute()),
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.brightness_6_rounded,
                title: 'appearance'.tr,
                onTap: () => controller.showThemeDialog(context),
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.language_rounded,
                title: 'language'.tr,
                onTap: () => controller.showLanguageDialog(context),
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                onTap: () async {
                  final Uri url = Uri.parse('https://yumpass.ai/privacy-policy');
                  if (await canLaunchUrl(url)) {
                    await launchUrl(url, mode: LaunchMode.externalApplication);
                  }
                },
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.delete_forever_outlined,
                title: 'delete_account'.tr,
                onTap: () => _showDeleteAccountDialog(context),
                isDestructive: true,
              ),
              Divider(height: 1, color: Theme.of(context).colorScheme.outline, indent: 56),
              _ProfileAccountTile(
                icon: Icons.logout,
                title: 'sign_out'.tr,
                onTap: () => controller.showSignOutDialog(context),
                isDestructive: true,
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showChangePasswordDialog(BuildContext context) {
    final currentPass = TextEditingController();
    final newPass = TextEditingController();
    final confirmPass = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('change_password'.tr, style: robotoBold),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentPass,
              obscureText: true,
              decoration: InputDecoration(labelText: 'current_password'.tr),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: newPass,
              obscureText: true,
              decoration: InputDecoration(labelText: 'new_password'.tr),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: confirmPass,
              obscureText: true,
              decoration: InputDecoration(labelText: 'confirm_password'.tr),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('cancel'.tr)),
          ElevatedButton(
            onPressed: () async {
              if (newPass.text.trim().length < 8) {
                Get.snackbar('error'.tr, 'password_min_length'.tr);
                return;
              }
              if (newPass.text != confirmPass.text) {
                Get.snackbar('error'.tr, 'passwords_do_not_match'.tr);
                return;
              }
              final ok = await controller.changePassword(
                currentPassword: currentPass.text,
                newPassword: newPass.text,
              );
              if (ok && ctx.mounted) Navigator.pop(ctx);
            },
            child: Text('save'.tr),
          ),
        ],
      ),
    );
  }

  void _showChangeEmailDialog(BuildContext context) {
    final newEmail = TextEditingController();
    final pass = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('change_email'.tr, style: robotoBold),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: newEmail,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(labelText: 'new_email'.tr),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: pass,
              obscureText: true,
              decoration: InputDecoration(labelText: 'password'.tr),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('cancel'.tr)),
          ElevatedButton(
            onPressed: () async {
              if (!newEmail.text.contains('@')) {
                Get.snackbar('error'.tr, 'invalid_email'.tr);
                return;
              }
              final ok = await controller.changeEmail(
                newEmail: newEmail.text.trim(),
                password: pass.text,
              );
              if (ok && ctx.mounted) Navigator.pop(ctx);
            },
            child: Text('save'.tr),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('delete_account'.tr, style: robotoBold.copyWith(color: Colors.redAccent)),
        content: Text('delete_account_confirm'.tr),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('cancel'.tr)),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () {
              Navigator.pop(ctx);
              controller.deleteAccount();
            },
            child: Text('delete_permanently'.tr, style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}


class _ProfileAccountTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final bool isDestructive;

  const _ProfileAccountTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(
              icon,
              color: isDestructive
                  ? AppColors.gradientStart
                  : Theme.of(context).colorScheme.onSurfaceVariant,
              size: 20,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: robotoRegular.copyWith(
                  color: isDestructive
                      ? AppColors.gradientStart
                      : Theme.of(context).colorScheme.onSurface,
                  fontSize: 15,
                ),
              ),
            ),
            if (!isDestructive)
              Icon(
                Icons.chevron_right,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
