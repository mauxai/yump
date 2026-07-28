import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/features/auth/controller/auth_controller.dart';
import 'package:lumen/features/auth/widget/auth_header.dart';
import 'package:lumen/features/auth/widget/auth_redirect_row.dart';
import 'package:lumen/features/auth/widget/auth_section_divider.dart';
import 'package:lumen/features/auth/widget/auth_social_section.dart';
import 'package:lumen/common/widgets/exit_confirm_dialog.dart';
import 'package:lumen/features/auth/widget/sign_in_form_section.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/util/dimensions.dart';

class SignInView extends GetView<AuthController> {
  const SignInView({super.key});

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        await ExitConfirmDialog.handleBack(context);
      },
      child: Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraLarge),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              SizedBox(height: Get.height * 0.09),
              AuthHeader(title: 'sign_in'.tr, subtitle: 'sign_in_subtitle'.tr),
              const SizedBox(height: 32),
              const SignInFormSection(),
              const SizedBox(height: 24),
              const AuthSectionDivider(),
              const SizedBox(height: 24),
              const AuthSocialSection(),
              const SizedBox(height: 32),
              AuthRedirectRow(
                message: 'dont_have_account'.tr,
                actionText: 'sign_up'.tr,
                onTap: () => Get.toNamed(RouteHelper.getCreateAccountRoute()),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
      ),
    );
  }
}
