import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/notification/widgets/notification_empty_state.dart';
import 'package:lumen/features/notification/widgets/notification_error_state.dart';
import 'package:lumen/features/notification/widgets/notification_header.dart';
import 'package:lumen/features/notification/widgets/notification_list.dart';
import 'package:lumen/features/notification/widgets/notification_list_shimmer.dart';
import '../controllers/notification_controller.dart';

class NotificationView extends  StatefulWidget{
  const NotificationView({super.key});

  @override
  State<NotificationView> createState() => _NotificationViewState();
}

class _NotificationViewState extends State<NotificationView> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Get.find<NotificationController>().loadNotifications(showLoader: false);
    });

  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const NotificationHeader(),
            Expanded(
              child: GetBuilder<NotificationController>(builder: (controller) {
                if (controller.isLoading && controller.notifications.isEmpty) {
                  return const NotificationListShimmer();
                }
                if (controller.hasError && controller.notifications.isEmpty) {
                  return NotificationErrorState(
                    message: controller.errorMessage,
                    onRetry: controller.loadNotifications,
                  );
                }
                if (controller.notifications.isEmpty) {
                  return const NotificationEmptyState();
                }
                return const NotificationList();
              }),
            ),
          ],
        ),
      ),
    );
  }
}
