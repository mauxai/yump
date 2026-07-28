import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/auth/widget/auth_back_button.dart';
import 'package:lumen/features/auth/widget/auth_header.dart';
import 'package:lumen/features/auth/widget/auth_redirect_row.dart';
import 'package:lumen/features/forgot_password/controller/forgot_password_controller.dart';
import 'package:lumen/features/forgot_password/widgets/forgot_password_form_section.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';

class ForgotPasswordView extends GetView<ForgotPasswordController> {
  const ForgotPasswordView({super.key});

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

              AuthHeader(
                title: 'forgot_password_title'.tr,
                subtitle: 'forgot_password_subtitle'.tr,
              ),

              const SizedBox(height: 32),

              const ForgotPasswordFormSection(),

              const SizedBox(height: 32),

              AuthRedirectRow(
                message: '',
                actionText: 'back_to_sign_in'.tr,
                onTap: () => Get.offAllNamed(RouteHelper.getSignInRoute()),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
