import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_gradient_button.dart';
import 'package:lumen/features/forgot_password/controller/forgot_password_controller.dart';
import 'package:lumen/features/forgot_password/widgets/otp_input_widget.dart';
import 'package:lumen/util/dimensions.dart';
import 'package:lumen/util/styles.dart';

class OtpVerificationFormSection extends StatefulWidget {
  const OtpVerificationFormSection({super.key});

  @override
  State<OtpVerificationFormSection> createState() => _OtpVerificationFormSectionState();
}

class _OtpVerificationFormSectionState extends State<OtpVerificationFormSection> {
  final _otpKey = GlobalKey<OtpInputWidgetState>();
  String _otp = '';

  void _submit() {
    Get.find<ForgotPasswordController>().verifyOtp(_otp);
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ForgotPasswordController>(
      builder: (c) => Column(
        children: [
          OtpInputWidget(
            key: _otpKey,
            enabled: !c.isLoading,
            onCompleted: (otp) => setState(() => _otp = otp),
          ),

          const SizedBox(height: 32),

          CustomGradientButton(
            text: 'verify_otp'.tr,
            isLoading: c.isLoading,
            onTap: c.isLoading ? () {} : _submit,
          ),

          const SizedBox(height: 20),

          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(
              'resend_otp'.tr,
              style: robotoRegular.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: Dimensions.fontSizeDefault,
              ),
            ),
            const SizedBox(width: 4),
            GestureDetector(
              onTap: c.isLoading ? null : () {
                _otpKey.currentState?.clear();
                setState(() => _otp = '');
                c.resendOtp();
              },
              child: Text(
                'resend_otp'.tr,
                style: robotoMedium.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                  fontSize: Dimensions.fontSizeDefault,
                ),
              ),
            ),
          ]),
        ],
      ),
    );
  }
}
