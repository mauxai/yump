import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/user_avatar.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class ProfileAvatarSection extends StatelessWidget {
  final String userName;
  final String userEmail;
  final String userPhoto;

  const ProfileAvatarSection({
    super.key,
    required this.userName,
    required this.userEmail,
    required this.userPhoto,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        children: [
          UserAvatar(
            name: userName,
            photoUrl: userPhoto,
            size: 90,
            borderRadius: Dimensions.radiusExtraLarge,
          ),
          const SizedBox(height: Dimensions.fontSizeSmall),
          Text(
            userName.isEmpty ? 'not_provided'.tr : userName,
            style: robotoBold.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: Dimensions.paddingSizeLarge,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            userEmail.isEmpty ? 'not_provided'.tr : userEmail,
            style: robotoRegular.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: Dimensions.fontSizeDefault,
            ),
          )
        ],
      ),
    );
  }
}
