import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/common/widgets/custom_text_field.dart';
import 'package:lumen/features/forgot_password/controller/forgot_password_controller.dart';

class ResetPasswordFormSection extends StatefulWidget {
  const ResetPasswordFormSection({super.key});

  @override
  State<ResetPasswordFormSection> createState() => _ResetPasswordFormSectionState();
}

class _ResetPasswordFormSectionState extends State<ResetPasswordFormSection> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _confirmFocus = FocusNode();

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    _confirmFocus.dispose();
    super.dispose();
  }

  void _submit() {
    Get.find<ForgotPasswordController>().resetPassword(
      newPassword: _passwordController.text,
      confirmPassword: _confirmController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CustomTextField(
          controller: _passwordController,
          hint: 'new_password_hint'.tr,
          prefixIcon: Icons.lock_outline,
          isPassword: true,
          textInputAction: TextInputAction.next,
          onSubmitted: () => FocusScope.of(context).requestFocus(_confirmFocus),
        ),

        const SizedBox(height: 12),

        CustomTextField(
          controller: _confirmController,
          hint: 'confirm_password_hint'.tr,
          prefixIcon: Icons.lock_outline,
          isPassword: true,
          textInputAction: TextInputAction.done,
          focusNode: _confirmFocus,
          onSubmitted: _submit,
        ),

        const SizedBox(height: 24),

        GetBuilder<ForgotPasswordController>(
          builder: (c) => CustomGradientButton(
            text: 'reset_password_btn'.tr,
            isLoading: c.isLoading,
            onTap: c.isLoading ? () {} : _submit,
          ),
        ),
      ],
    );
  }
}
