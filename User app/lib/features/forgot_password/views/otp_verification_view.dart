import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/auth/widget/auth_header.dart';
import 'package:lumen/features/forgot_password/controller/forgot_password_controller.dart';
import 'package:lumen/features/forgot_password/widgets/otp_verification_form_section.dart';
import 'package:lumen/util/dimensions.dart';

class OtpVerificationView extends GetView<ForgotPasswordController> {
  const OtpVerificationView({super.key});

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

              GetBuilder<ForgotPasswordController>(
                builder: (c) => AuthHeader(
                  title: 'otp_verification_title'.tr,
                  subtitle: 'otp_verification_subtitle'.trParams({'email': c.email}),
                ),
              ),

              const SizedBox(height: 32),

              const OtpVerificationFormSection(),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
