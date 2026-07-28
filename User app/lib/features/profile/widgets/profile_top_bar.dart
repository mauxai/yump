import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ProfileTopBar extends StatelessWidget {
  const ProfileTopBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Text(
      'profile'.tr,
      style: robotoBold.copyWith(
        color: Theme.of(context).colorScheme.onSurface,
        fontSize: Dimensions.fontSizeOverLarge,
      ),
    );
  }
}
