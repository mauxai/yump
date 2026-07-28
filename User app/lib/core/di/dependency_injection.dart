import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/common/models/language_model.dart';
import 'package:lumen/core/theme/theme_controller.dart';
import 'package:lumen/common/controller/config_controller.dart';
import 'package:lumen/common/controller/localization_controller.dart';
import 'package:lumen/common/repo/config_repo.dart';
import 'package:lumen/features/auth/controller/auth_controller.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/features/forgot_password/controller/forgot_password_controller.dart';
import 'package:lumen/features/forgot_password/repo/forgot_password_repo.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/features/dashboard/repos/dashboard_repo.dart';
import 'package:lumen/features/editor/controllers/editor_controller.dart';
import 'package:lumen/features/home/controllers/home_controller.dart';
import 'package:lumen/features/home/repo/home_repo.dart';
import 'package:lumen/features/notification/controllers/notification_controller.dart';
import 'package:lumen/features/notification/repo/notification_repo.dart';
import 'package:lumen/features/onboarding/controllers/onboarding_controller.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/features/projects/repo/projects_repo.dart';
import 'package:lumen/features/activity/controllers/activity_controller.dart';
import 'package:lumen/features/activity/repo/activity_repo.dart';
import 'package:lumen/features/update/controllers/update_controller.dart';
import 'package:lumen/features/upgrade/controllers/upgrade_controller.dart';
import 'package:lumen/features/upgrade/repo/upgrade_repo.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DependencyInjection {
  static Future<(bool, Map<String, Map<String, String>>)> init() async {

    /// Core
    final sharedPreferences = await SharedPreferences.getInstance();
    Get.lazyPut<SharedPreferences>(() => sharedPreferences, fenix: true);
    Get.lazyPut(() => ApiClient(appBaseUrl: AppConstants.baseUrl, sharedPreferences: Get.find()), fenix: true);

    /// Repository
    final authRepo = AuthRepo(sharedPreferences: Get.find(), apiClient: Get.find());
    Get.lazyPut(() => authRepo, fenix: true);
    Get.lazyPut(() => ActivityRepo(authRepo: Get.find(), apiClient: Get.find()), fenix: true);
    Get.lazyPut(() => ProjectsRepo(authRepo: Get.find(), apiClient: Get.find()), fenix: true);
    Get.lazyPut(() => HomeRepo(authRepo: Get.find(), apiClient: Get.find()), fenix: true);
    Get.lazyPut(() => UpgradeRepo(authRepo: Get.find(), apiClient: Get.find()), fenix: true);
    Get.lazyPut(() => DashboardRepo(authRepo: Get.find(), apiClient: Get.find()), fenix: true);
    Get.lazyPut(() => NotificationRepo(authRepo: Get.find(), apiClient: Get.find()), fenix: true);
    Get.lazyPut(() => ForgotPasswordRepo(apiClient: Get.find()), fenix: true);
    Get.lazyPut(() => ConfigRepo(apiClient: Get.find()), fenix: true);

    /// Controller
    Get.lazyPut(() => ThemeController(authRepo: Get.find()), fenix: true);
    Get.lazyPut(() => LocalizationController(authRepo: Get.find()), fenix: true);
    Get.lazyPut(() => OnboardingController(), fenix: true);
    Get.lazyPut(() => AuthController(authRepo: Get.find()), fenix: true);
    Get.lazyPut(() => DashboardController(dashboardRepo: Get.find()), fenix: true);
    Get.lazyPut(() => ActivityController(activityRepo: Get.find()), fenix: true);
    Get.lazyPut(() => HomeController(projectsRepo: Get.find(), homeRepo: Get.find()), fenix: true);
    Get.lazyPut(() => ProjectsController(projectsRepo: Get.find()), fenix: true);
    Get.lazyPut(() => ProfileController(authRepo: Get.find()), fenix: true);
    Get.lazyPut(() => EditorController(projectsRepo: Get.find()), fenix: true);
    Get.lazyPut(() => NotificationController(notificationRepo: Get.find()), fenix: true);
    Get.lazyPut(() => UpdateController(), fenix: true);
    Get.lazyPut(() => UpgradeController(repo: Get.find()), fenix: true);
    Get.lazyPut(() => ForgotPasswordController(repo: Get.find()), fenix: true);
    Get.lazyPut(() => ConfigController(configRepo: Get.find()), fenix: true);

    Map<String, Map<String, String>> languages = {};
    for(LanguageModel languageModel in AppConstants.languages) {
      String jsonStringValues =  await rootBundle.loadString('assets/language/${languageModel.languageCode}.json');
      Map<String, dynamic> mappedJson = json.decode(jsonStringValues);
      Map<String, String> jsonValue = {};
      mappedJson.forEach((key, value) {
        jsonValue[key] = value.toString();
      });
      languages['${languageModel.languageCode}_${languageModel.countryCode}'] = jsonValue;
    }

    final isLoggedIn = authRepo.isLoggedIn;

    return (isLoggedIn, languages);
  }
}
