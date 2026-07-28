import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class LocalizationController extends GetxController {
  final AuthRepo _authRepo;
  Locale _locale = const Locale('en', 'US');
  Locale get locale => _locale;

  LocalizationController({required AuthRepo authRepo}) : _authRepo = authRepo;

  @override
  void onInit() {
    super.onInit();
    _loadCurrentLanguage();
  }

  void setLanguage(Locale locale) {
    _locale = locale;
    Get.updateLocale(locale);
    _authRepo.saveString(
      AppConstants.languageCode,
      '${locale.languageCode}_${locale.countryCode}',
    );
    update();
  }

  void _loadCurrentLanguage() {
    final saved = _authRepo.getString(AppConstants.languageCode) ??
        _authRepo.getString('locale');
    if (saved != null) {
      final parts = saved.split('_');
      if (parts.length == 2) {
        _locale = Locale(parts[0], parts[1]);
      }
    }
  }
}
