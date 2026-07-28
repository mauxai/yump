import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class EditingInProgressDialog extends StatelessWidget {
  const EditingInProgressDialog({super.key});

  static Future<bool> show(BuildContext context) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (_) => const EditingInProgressDialog(),
    );
    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusLarge)),
      title: Text(
        'editing_in_progress_title'.tr,
        style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge),
      ),
      content: Text(
        'editing_in_progress_message'.tr,
        style: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeDefault,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Get.back(result: false),
          child: Text(
            'stay'.tr,
            style: robotoMedium.copyWith(
              fontSize: Dimensions.fontSizeDefault,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),

        TextButton(
          onPressed: () => Get.back(result: true),
          child: Text(
            'leave'.tr,
            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault, color: Colors.red),
          ),
        ),
      ],
    );
  }
}
