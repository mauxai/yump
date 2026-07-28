import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/auth/controller/auth_controller.dart';
import 'package:lumen/features/auth/widget/auth_back_button.dart';
import 'package:lumen/features/auth/widget/auth_form_section.dart';
import 'package:lumen/features/auth/widget/auth_header.dart';
import 'package:lumen/features/auth/widget/auth_redirect_row.dart';
import 'package:lumen/features/auth/widget/auth_section_divider.dart';
import 'package:lumen/features/auth/widget/auth_social_section.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';

class SignUpView extends GetView<AuthController> {
  const SignUpView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraLarge),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              const AuthBackButton(),
              const SizedBox(height: 28),
              AuthHeader(title: 'create_account'.tr, subtitle: 'create_account_subtitle'.tr),
              const SizedBox(height: 32),
              const AuthSocialSection(),
              const SizedBox(height: 24),
              const AuthSectionDivider(),
              const SizedBox(height: Dimensions.paddingSizeLarge),
              const AuthFormSection(),
              const SizedBox(height: 32),
              AuthRedirectRow(
                message: 'already_have_account'.tr,
                actionText: 'sign_in'.tr,
                onTap: () => Get.toNamed(RouteHelper.getSignInRoute()),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
