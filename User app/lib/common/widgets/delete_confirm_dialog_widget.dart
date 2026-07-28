import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class DeleteConfirmDialog extends StatelessWidget {
  final VoidCallback onConfirm;
  final String? title;
  final String? message;
  final String? confirmLabel;

  const DeleteConfirmDialog({super.key, required this.onConfirm, this.title, this.message, this.confirmLabel});

  static Future<void> show(BuildContext context, {required VoidCallback onConfirm, String? title, String? message, String? confirmLabel}) {
    return showDialog(
      context: context,
      builder: (_) => DeleteConfirmDialog(onConfirm: onConfirm, title: title, message: message, confirmLabel: confirmLabel),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusLarge)),
      title: Text(title ?? 'delete_project'.tr, style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),
      content: Text(
        message ?? 'delete_project_confirm'.tr,
        style: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeDefault,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
      actions: [
        TextButton(
          onPressed: Get.back,
          child: Text(
            'cancel'.tr,
            style: robotoMedium.copyWith(
              fontSize: Dimensions.fontSizeDefault,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),

        TextButton(
          onPressed: () {
            Get.back();
            onConfirm();
          },
          child: Text(
            confirmLabel ?? 'delete'.tr,
            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault, color: Colors.red),
          ),
        ),
      ],
    );
  }
}
