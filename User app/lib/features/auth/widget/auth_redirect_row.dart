import 'package:flutter/material.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class AuthRedirectRow extends StatelessWidget {
  final String message;
  final String actionText;
  final VoidCallback onTap;

  const AuthRedirectRow({super.key, required this.message, required this.actionText, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      Text(
        message,
        style: robotoRegular.copyWith(color: colorScheme.onSurfaceVariant, fontSize: Dimensions.fontSizeDefault),
      ),

      const SizedBox(width: 4),

      GestureDetector(
        onTap: onTap,
        child: Text(
          actionText,
          style: robotoMedium.copyWith(color: colorScheme.primary, fontSize: Dimensions.fontSizeDefault),
        ),
      ),
    ]);
  }
}
