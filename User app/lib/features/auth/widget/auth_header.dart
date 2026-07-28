import 'package:flutter/material.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class AuthHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const AuthHeader({super.key, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: robotoBold.copyWith(color: colorScheme.onSurface, fontSize: Dimensions.fontSizeOverLarge + 4)),
        const SizedBox(height: Dimensions.paddingSizeEight),
        Text(subtitle, style: robotoRegular.copyWith(color: colorScheme.onSurfaceVariant, fontSize: Dimensions.fontSizeDefault)),
      ],
    );
  }
}
