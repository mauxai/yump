import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/auth/widget/auth_header.dart';
import 'package:lumen/features/forgot_password/controller/forgot_password_controller.dart';
import 'package:lumen/features/forgot_password/widgets/reset_password_form_section.dart';
import 'package:lumen/util/dimensions.dart';

class ResetPasswordView extends GetView<ForgotPasswordController> {
  const ResetPasswordView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraLarge),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: Get.height * 0.09),

              AuthHeader(
                title: 'reset_password_title'.tr,
                subtitle: 'reset_password_subtitle'.tr,
              ),

              const SizedBox(height: 32),

              const ResetPasswordFormSection(),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
