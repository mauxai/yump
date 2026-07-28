import 'package:flutter/material.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class HomeSectionHeaderWidget extends StatelessWidget {
  final String title;
  final Widget? trailing;

  const HomeSectionHeaderWidget({
    super.key,
    required this.title,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: robotoBold.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
            fontSize: Dimensions.fontSizeExtraLarge,
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}
