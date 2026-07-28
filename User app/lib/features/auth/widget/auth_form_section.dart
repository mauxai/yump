import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_text_field.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/features/auth/controller/auth_controller.dart';

class AuthFormSection extends StatefulWidget {
  const AuthFormSection({super.key});

  @override
  State<AuthFormSection> createState() => _AuthFormSectionState();
}

class _AuthFormSectionState extends State<AuthFormSection> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  void _submit() {
    Get.find<AuthController>().createAccountWithEmail(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CustomTextField(
          controller: _nameController,
          hint: 'name_hint'.tr,
          prefixIcon: Icons.person_outline,
          textInputAction: TextInputAction.next,
          onSubmitted: () => FocusScope.of(context).requestFocus(_emailFocus),
        ),

        const SizedBox(height: 12),

        CustomTextField(
          controller: _emailController,
          hint: 'email_hint'.tr,
          prefixIcon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          focusNode: _emailFocus,
          onSubmitted: () => FocusScope.of(context).requestFocus(_passwordFocus),
        ),

        const SizedBox(height: 12),

        CustomTextField(
          controller: _passwordController,
          hint: 'password_hint'.tr,
          prefixIcon: Icons.lock_outline,
          isPassword: true,
          textInputAction: TextInputAction.done,
          focusNode: _passwordFocus,
          onSubmitted: _submit,
        ),

        const SizedBox(height: 24),

        GetBuilder<AuthController>(
          builder: (c) => CustomGradientButton(
            text: 'create_account'.tr,
            isLoading: c.isEmailLoading,
            onTap: c.isAnyLoading ? () {} : _submit,
          ),
        ),
      ],
    );
  }
}
