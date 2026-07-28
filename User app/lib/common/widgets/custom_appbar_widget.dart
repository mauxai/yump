import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool showBackButton;
  final List<Widget>? actions;
  final PreferredSizeWidget? bottom;

  const CustomAppBar({
    super.key,
    required this.title,
    this.showBackButton = true,
    this.actions,
    this.bottom,
  });

  @override
  Size get preferredSize => Size.fromHeight(
    kToolbarHeight + (bottom?.preferredSize.height ?? 0),
  );

  @override
  Widget build(BuildContext context) {
    return AppBar(
      titleSpacing: showBackButton ? 0 : Dimensions.paddingSizeExtraLarge,
      automaticallyImplyLeading: false,
      leading: showBackButton
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, size: 18),
              onPressed: Get.back,
            )
          : null,
      title: Text(
        title,
        style: robotoMedium.copyWith(
          color: Theme.of(context).colorScheme.onSurface,
          fontSize: Dimensions.fontSizeLarge,
        ),
      ),
      actions: actions,
      bottom: bottom,
    );
  }
}
