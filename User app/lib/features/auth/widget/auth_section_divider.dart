import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class AuthSectionDivider extends StatelessWidget {
  const AuthSectionDivider({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      children: [
        Expanded(child: Divider(height: 1, color: colorScheme.outline)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'or_email'.tr,
            style: robotoMedium.copyWith(color: colorScheme.onSurfaceVariant, fontSize: Dimensions.fontSizeSmall, letterSpacing: 1),
          ),
        ),
        Expanded(child: Divider(height: 1, color: colorScheme.outline)),
      ],
    );
  }
}
