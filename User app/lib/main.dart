import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:lumen/common/controller/config_controller.dart';
import 'package:lumen/common/models/notification_body_model.dart';
import 'package:lumen/core/di/dependency_injection.dart';
import 'package:lumen/core/theme/theme_controller.dart';
import 'package:lumen/common/models/translation_model.dart';
import 'package:lumen/features/auth/controller/auth_controller.dart';
import 'package:lumen/helper/notification_helper.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/enums.dart';
import 'core/theme/app_theme.dart';
import 'common/controller/localization_controller.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

@pragma('vm:entry-point')
Future<dynamic> myBackgroundMessageHandler(RemoteMessage message) async {
  if (kDebugMode) {
    print('onBackground: ${message.notification?.title}/${message.notification?.body}');
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);

  await Firebase.initializeApp();

  if (defaultTargetPlatform == TargetPlatform.android) {
    await FirebaseMessaging.instance.requestPermission();
  }

  final (isLoggedIn, languages) = await DependencyInjection.init();

  NotificationBody? initialNotification;
  try {
    if (GetPlatform.isMobile) {
      final RemoteMessage? remoteMessage = await FirebaseMessaging.instance.getInitialMessage();
      if (remoteMessage != null && remoteMessage.data.isNotEmpty) {
        initialNotification = NotificationBody.fromJson(remoteMessage.data);
      }
      await NotificationHelper.initialize(flutterLocalNotificationsPlugin);
      FirebaseMessaging.onBackgroundMessage(myBackgroundMessageHandler);
    }
  } catch (e) {
    if (kDebugMode) print('notification init error: $e');
  }

  if (isLoggedIn) {
    Get.find<AuthController>().updateToken();
  }

  runApp(MyApp(isLoggedIn: isLoggedIn, languages: languages, initialNotification: initialNotification));
}

class MyApp extends StatelessWidget {
  final bool isLoggedIn;
  final Map<String, Map<String, String>> languages;
  final NotificationBody? initialNotification;

  const MyApp({super.key, required this.isLoggedIn, required this.languages, this.initialNotification});

  String _resolveInitialRoute() {
    if (isLoggedIn && initialNotification?.notificationType == NotificationType.editCompleted && (initialNotification?.image?.isNotEmpty ?? false)) {
      return RouteHelper.getEditorRoute(
        imagePath: initialNotification!.image!,
        projectName: initialNotification?.projectName ?? 'Untitled',
        projectId: initialNotification!.projectId,
        fromNotification: true
      );
    }
    return isLoggedIn ? RouteHelper.getDashboardRoute() : RouteHelper.getInitialRoute();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ConfigController>(builder: (configController){
      return GetBuilder<ThemeController>(builder: (themeController) {
        return GetBuilder<LocalizationController>(builder: (localizationController) {
          return GetMaterialApp(
            title: AppConstants.appName,
            theme: themeController.darkTheme ? AppTheme.dark : AppTheme.light,
            locale: localizationController.locale,
            translations: Messages(languages: languages),
            fallbackLocale: const Locale('en', 'US'),
            initialRoute: _resolveInitialRoute(),
            getPages: RouteHelper.routes,
            debugShowCheckedModeBanner: false,
          );
        });
      });
    });
  }
}
