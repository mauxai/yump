import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/common/widgets/custom_text_field.dart';
import 'package:lumen/features/forgot_password/controller/forgot_password_controller.dart';

class ForgotPasswordFormSection extends StatefulWidget {
  const ForgotPasswordFormSection({super.key});

  @override
  State<ForgotPasswordFormSection> createState() => _ForgotPasswordFormSectionState();
}

class _ForgotPasswordFormSectionState extends State<ForgotPasswordFormSection> {
  final _emailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _submit() {
    Get.find<ForgotPasswordController>().sendOtp(_emailController.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CustomTextField(
          controller: _emailController,
          hint: 'email_hint'.tr,
          prefixIcon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.done,
          onSubmitted: _submit,
        ),

        const SizedBox(height: 24),

        GetBuilder<ForgotPasswordController>(
          builder: (c) => CustomGradientButton(
            text: 'send_otp'.tr,
            isLoading: c.isLoading,
            onTap: c.isLoading ? () {} : _submit,
          ),
        ),
      ],
    );
  }
}
