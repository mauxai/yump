import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/auth/controller/auth_controller.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';
import 'auth_social_button.dart';

class AuthSocialSection extends StatelessWidget {
  const AuthSocialSection({super.key});

  @override
  Widget build(BuildContext context) {

    return Column(
      children: [
        GetBuilder<AuthController>(
          builder: (controller) => AuthSocialButton(
            icon: Text(
              'G',
              style: robotoBold.copyWith(fontSize: Dimensions.paddingSizeLarge, color: const Color(0xFF4285F4)),
            ),
            label: 'continue_google'.tr,
            isLoading: controller.isGoogleLoading,
            onTap: controller.isAnyLoading ? null : () => controller.signInWithGoogle(),
          ),
        ),
       // const SizedBox(height: 12),
        // AuthSocialButton(
        //   icon: Icon(Icons.apple, color: colorScheme.onSurface, size: 22),
        //   label: 'continue_apple'.tr,
        //   onTap: () => showCustomSnackBar('apple_coming_soon'.tr, isError: false),
        // ),
      ],
    );
  }
}
