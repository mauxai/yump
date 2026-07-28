import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:lumen/common/models/notification_body_model.dart';
import 'package:lumen/features/notification/controllers/notification_controller.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:lumen/util/enums.dart';
import 'package:path_provider/path_provider.dart';

class NotificationHelper {
  static Future<void> initialize(FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin) async {
    var androidInitialize = const AndroidInitializationSettings('notification_icon');
    var iOSInitialize = const DarwinInitializationSettings();
    var initializationsSettings = InitializationSettings(android: androidInitialize, iOS: iOSInitialize);

    flutterLocalNotificationsPlugin.initialize(initializationsSettings,
      onDidReceiveNotificationResponse: (NotificationResponse? notificationResponse) async {
        try {
          if (notificationResponse?.payload != null && notificationResponse!.payload!.isNotEmpty) {
            final NotificationBody notificationBody = NotificationBody.fromJson(jsonDecode(notificationResponse.payload!));
            _handleNotificationTap(notificationBody);
          }
        } catch (e) {
          if (kDebugMode) print('local notification tap error: $e');
        }
      },
    );

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) {
        print('onMessage: ${message.data}');
      }
      showNotification(message, flutterLocalNotificationsPlugin);
      Get.find<NotificationController>().loadNotifications(showLoader: false);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage? message) {
      if (kDebugMode) {
        print('onMessageOpenedApp: ${message?.data}');
      }
      if (message != null && message.data.isNotEmpty) {
        _handleNotificationTap(convertNotification(message.data));
      }
    });
  }

  static void _handleNotificationTap(NotificationBody body) {
    if (body.notificationType == NotificationType.editCompleted && (body.image?.isNotEmpty ?? false)) {
      Get.toNamed(RouteHelper.getEditorRoute(
        imagePath: body.image!,
        projectName: body.projectName ?? 'Untitled',
        projectId: body.projectId,
        fromNotification: true,
      ));
    }
  }

  static Future<void> showNotification(RemoteMessage message, FlutterLocalNotificationsPlugin fln) async {
    if (GetPlatform.isIOS) return;

    final String title = message.data['title'] ?? message.notification?.title ?? '';
    final String body = message.data['body'] ?? message.notification?.body ?? '';
    final String payload = jsonEncode(message.data);

    String? image = message.data['image'];
    if (image != null && image.isNotEmpty && !image.startsWith('http')) {
      image = '${AppConstants.baseUrl}/storage/app/public/notification/$image';
    }

    if (image != null && image.isNotEmpty) {
      try {
        await _showBigPictureNotification(title, body, payload, image, fln);
      } catch (_) {
        await _showBigTextNotification(title: title, body: body, payload: payload, fln: fln);
      }
    } else {
      await _showBigTextNotification(title: title, body: body, payload: payload, fln: fln);
    }
  }

  static Future<void> _showBigTextNotification({
    required String title,
    required String body,
    required String payload,
    required FlutterLocalNotificationsPlugin fln,
  }) async {
    final BigTextStyleInformation bigTextStyleInformation = BigTextStyleInformation(
      body, htmlFormatBigText: true,
      contentTitle: title, htmlFormatContentTitle: true,
    );
    final AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      AppConstants.appName, '${AppConstants.appName} notifications',
      channelDescription: 'Notification channel for ${AppConstants.appName}',
      playSound: true,
      sound: const RawResourceAndroidNotificationSound('notification'),
      importance: Importance.max,
      styleInformation: bigTextStyleInformation,
      priority: Priority.max,
    );
    final NotificationDetails platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);
    await fln.show(Random().nextInt(100), title, body, platformChannelSpecifics, payload: payload);
  }

  static Future<void> _showBigPictureNotification(
    String title, String body, String payload, String image, FlutterLocalNotificationsPlugin fln,
  ) async {
    final String largeIconPath = await _downloadAndSaveFile(image, 'largeIcon');
    final String bigPicturePath = await _downloadAndSaveFile(image, 'bigPicture');
    final BigPictureStyleInformation bigPictureStyleInformation = BigPictureStyleInformation(
      FilePathAndroidBitmap(bigPicturePath),
      hideExpandedLargeIcon: true,
      contentTitle: title, htmlFormatContentTitle: true,
      summaryText: body, htmlFormatSummaryText: true,
    );
    final AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      AppConstants.appName, '${AppConstants.appName} notifications',
      channelDescription: 'Notification channel for ${AppConstants.appName}',
      playSound: true,
      sound: const RawResourceAndroidNotificationSound('notification'),
      largeIcon: FilePathAndroidBitmap(largeIconPath),
      priority: Priority.max,
      styleInformation: bigPictureStyleInformation,
      importance: Importance.max,
    );
    final NotificationDetails platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);
    await fln.show(Random().nextInt(100), title, body, platformChannelSpecifics, payload: payload);
  }

  static Future<String> _downloadAndSaveFile(String url, String fileName) async {
    final Directory directory = await getApplicationDocumentsDirectory();
    final String filePath = '${directory.path}/$fileName';
    final http.Response response = await http.get(Uri.parse(url));
    final File file = File(filePath);
    await file.writeAsBytes(response.bodyBytes);
    return filePath;
  }

  static NotificationBody convertNotification(Map<String, dynamic> data) {
    return NotificationBody.fromJson(data);
  }
}


