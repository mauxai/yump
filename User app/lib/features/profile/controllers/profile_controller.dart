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
          children: [
            ListTile(
              title: Text('english'.tr, style: robotoRegular.copyWith(color: cs.onSurface)),
              onTap: () { localization.setLanguage(const Locale('en', 'US')); Get.back(); },
            ),
            ListTile(
              title: Text('bangla'.tr, style: robotoRegular.copyWith(color: cs.onSurface)),
              onTap: () { localization.setLanguage(const Locale('bn', 'BD')); Get.back(); },
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
