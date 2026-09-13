import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/common/controller/localization_controller.dart';
import 'package:lumen/common/models/api_error_response.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/core/theme/theme_controller.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/styles.dart';

class ProfileController extends GetxController implements GetxService {
  final AuthRepo _authRepo;

  ProfileController({required AuthRepo authRepo}) : _authRepo = authRepo;

  UserModel? user;
  bool isLoadingProfile = false;
  bool isUpdating = false;


  Future<void> fetchProfile() async {
    user = await _authRepo.fetchProfile();
    update();
  }

  Future<void> updateProfile({required String name, String? password, XFile? avatar}) async {
    if (isUpdating) return;
    isUpdating = true;
    update();
    final response = await _authRepo.updateProfile(name: name, password: password, avatar: avatar);
    isUpdating = false;
    update();
    if (response.statusCode != 200) {
      final ApiErrorResponse error = ApiErrorResponse.fromJson(response.body);
      showCustomSnackBar(error.displayMessage('update_profile_failed'.tr));
      return;
    }
    showCustomSnackBar('profile_updated'.tr, isError: false);
    await fetchProfile();
  }

  Future<bool> changePassword({required String currentPassword, required String newPassword}) async {
    final response = await _authRepo.changePassword(currentPassword: currentPassword, newPassword: newPassword);
    if (response.statusCode == 200) {
      showCustomSnackBar('password_changed_successfully'.tr, isError: false);
      return true;
    } else {
      final err = response.body?['error'] ?? 'failed_to_change_password'.tr;
      showCustomSnackBar(err);
      return false;
    }
  }

  Future<bool> changeEmail({required String newEmail, required String password}) async {
    final response = await _authRepo.changeEmail(newEmail: newEmail, password: password);
    if (response.statusCode == 200) {
      showCustomSnackBar('email_changed_successfully'.tr, isError: false);
      await fetchProfile();
      return true;
    } else {
      final err = response.body?['error'] ?? 'failed_to_change_email'.tr;
      showCustomSnackBar(err);
      return false;
    }
  }

  Future<void> deleteAccount() async {
    final response = await _authRepo.deleteAccount();
    if (response.statusCode == 200) {
      await _authRepo.signOut();
      Get.offAllNamed(RouteHelper.getSignInRoute());
      showCustomSnackBar('account_deleted_successfully'.tr, isError: false);
    } else {
      showCustomSnackBar('failed_to_delete_account'.tr);
    }
  }

  void goToUpgrade() {
    Get.toNamed(RouteHelper.getUpgradeRoute());
  }

  void showLanguageDialog(BuildContext context) {
    final localization = Get.find<LocalizationController>();
    final cs = Theme.of(context).colorScheme;
    Get.dialog(
      AlertDialog(
        backgroundColor: cs.surface,
        title: Text('select_language'.tr, style: robotoRegular.copyWith(color: cs.onSurface)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: AppConstants.languages.map((lang) {
            final isSelected = localization.locale.languageCode == lang.languageCode;
            return ListTile(
              title: Text(lang.languageName ?? '', style: robotoRegular.copyWith(
                color: isSelected ? cs.primary : cs.onSurface,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              )),
              trailing: isSelected ? Icon(Icons.check_circle_rounded, color: cs.primary, size: 20) : null,
              onTap: () {
                if (lang.languageCode != null) {
                  localization.setLanguage(Locale(lang.languageCode!, lang.countryCode));
                }
                Get.back();
              },
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: Text('cancel'.tr, style: robotoRegular.copyWith(color: cs.onSurfaceVariant)),
          ),
        ],
      ),
    );
  }

  void showThemeDialog(BuildContext context) {
    final themeController = Get.find<ThemeController>();
    final cs = Theme.of(context).colorScheme;
    Get.dialog(
      AlertDialog(
        backgroundColor: cs.surface,
        title: Text('choose_appearance'.tr, style: robotoRegular.copyWith(color: cs.onSurface)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.dark_mode_rounded, color: cs.onSurface),
              title: Text('dark_mode'.tr, style: robotoRegular.copyWith(color: cs.onSurface)),
              trailing: themeController.darkTheme ? Icon(Icons.check, color: cs.onSurface) : null,
              onTap: () { themeController.setTheme(true); Get.back(); },
            ),
            ListTile(
              leading: Icon(Icons.light_mode_rounded, color: cs.onSurface),
              title: Text('light_mode'.tr, style: robotoRegular.copyWith(color: cs.onSurface)),
              trailing: !themeController.darkTheme ? Icon(Icons.check, color: cs.onSurface) : null,
              onTap: () { themeController.setTheme(false); Get.back(); },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: Text('cancel'.tr, style: robotoRegular.copyWith(color: cs.onSurfaceVariant)),
          ),
        ],
      ),
    );
  }

  void showSignOutDialog(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    Get.dialog(
      AlertDialog(
        backgroundColor: cs.surface,
        title: Text('sign_out'.tr, style: robotoMedium.copyWith(color: cs.onSurface)),
        content: Text(
          'sign_out_confirm_message'.tr,
          style: robotoRegular.copyWith(color: cs.onSurfaceVariant),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: Text('cancel'.tr, style: robotoRegular.copyWith(color: cs.onSurfaceVariant)),
          ),
          TextButton(
            onPressed: () { Get.back(); signOut(); },
            child: Text('sign_out'.tr, style: robotoMedium.copyWith(color: const Color(0xFFFF3B30))),
          ),
        ],
      ),
    );
  }

  Future<void> signOut() async {
    await _authRepo.signOut();
    Get.offAllNamed(RouteHelper.getInitialRoute());
  }
}
