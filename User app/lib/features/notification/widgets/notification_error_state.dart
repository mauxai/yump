import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class NotificationErrorState extends StatelessWidget {
  final String? message;
  final VoidCallback onRetry;

  const NotificationErrorState({super.key, required this.onRetry, this.message});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraLarge),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(Dimensions.radiusExtraLarge + 4),
            ),
            child: Icon(
              Icons.wifi_off_rounded,
              color: theme.colorScheme.onSurfaceVariant,
              size: 36,
            ),
          ),
          const SizedBox(height: Dimensions.fontSizeLarge),
          Text(
            'notifications_error_title'.tr,
            style: robotoBold.copyWith(
              color: theme.colorScheme.onSurface,
              fontSize: Dimensions.fontSizeExtraLarge,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            (message != null && message!.isNotEmpty) ? message! : 'notifications_error_subtitle'.tr,
            textAlign: TextAlign.center,
            style: robotoRegular.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: Dimensions.fontSizeDefault,
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeLarge),
          OutlinedButton(
            onPressed: onRetry,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: Dimensions.paddingSizeExtraLarge,
                vertical: Dimensions.paddingSizeSmall + 2,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
              ),
              side: BorderSide(color: theme.colorScheme.outline),
            ),
            child: Text(
              'retry'.tr,
              style: robotoMedium.copyWith(
                color: theme.colorScheme.onSurface,
                fontSize: Dimensions.fontSizeDefault,
              ),
            ),
          ),
        ]),
      ),
    );
  }
}
