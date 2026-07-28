import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/common/widgets/custom_text_field.dart';
import 'package:lumen/core/theme/app_colors.dart';
import 'package:lumen/features/auth/controller/auth_controller.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class SignInFormSection extends StatefulWidget {
  const SignInFormSection({super.key});

  @override
  State<SignInFormSection> createState() => _SignInFormSectionState();
}

class _SignInFormSectionState extends State<SignInFormSection> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordFocus = FocusNode();
  bool _rememberMe = false;

  @override
  void initState() {
    super.initState();
    final c = Get.find<AuthController>();
    if (c.isRememberMe) {
      _rememberMe = true;
      _emailController.text = c.rememberedEmail ?? '';
      _passwordController.text = c.rememberedPassword ?? '';
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  void _submit() {
    Get.find<AuthController>().signInWithEmail(
      email: _emailController.text.trim(),
      password: _passwordController.text,
      rememberMe: _rememberMe,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        CustomTextField(
          controller: _emailController,
          hint: 'email_hint'.tr,
          prefixIcon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
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

        const SizedBox(height: 14),

        Row(children: [
          GestureDetector(
            onTap: () => setState(() => _rememberMe = !_rememberMe),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                gradient: _rememberMe ? AppColors.mainGradient : null,
                color: _rememberMe ? null : Colors.transparent,
                borderRadius: BorderRadius.circular(5),
                border: _rememberMe ? null : Border.all(color: colorScheme.outline),
              ),
              child: _rememberMe
                  ? const Icon(Icons.check_rounded, color: Colors.white, size: 14)
                  : null,
            ),
          ),

          const SizedBox(width: Dimensions.paddingSizeEight),

          Text(
            'remember_me'.tr,
            style: robotoRegular.copyWith(color: colorScheme.onSurfaceVariant, fontSize: Dimensions.fontSizeDefault),
          ),

          const Spacer(),

          GestureDetector(
            onTap: () => Get.toNamed(RouteHelper.getForgotPasswordRoute()),
            child: Text(
              'forgot_password'.tr,
              style: robotoMedium.copyWith(color: colorScheme.primary, fontSize: Dimensions.fontSizeDefault),
            ),
          ),
        ]),

        const SizedBox(height: 24),

        GetBuilder<AuthController>(
          builder: (c) => CustomGradientButton(
            text: 'sign_in'.tr,
            isLoading: c.isEmailLoading,
            onTap: c.isAnyLoading ? () {} : _submit,
          ),
        ),
      ],
    );
  }
}
