import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ExitConfirmDialog extends StatelessWidget {
  const ExitConfirmDialog({super.key});

  static Future<bool> show(BuildContext context) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (_) => const ExitConfirmDialog(),
    );
    return result ?? false;
  }

  /// Shared back-press handler for top-level screens: shows the confirm
  /// dialog and closes the app when the user accepts.
  static Future<void> handleBack(BuildContext context) async {
    if (await show(context)) await SystemNavigator.pop();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusLarge)),
      title: Text('exit_app_title'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
      content: Text(
        'exit_app_message'.tr,
        style: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeDefault,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Get.back(result: false),
          child: Text(
            'cancel'.tr,
            style: robotoMedium.copyWith(
              fontSize: Dimensions.fontSizeDefault,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),

        TextButton(
          onPressed: () => Get.back(result: true),
          child: Text(
            'exit'.tr,
            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault, color: Colors.red),
          ),
        ),
      ],
    );
  }
}
