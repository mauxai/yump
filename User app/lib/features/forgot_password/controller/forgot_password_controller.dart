import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/forgot_password/repo/forgot_password_repo.dart';
import 'package:lumen/helper/route_helper.dart';

class ForgotPasswordController extends GetxController {
  final ForgotPasswordRepo _repo;

  ForgotPasswordController({required ForgotPasswordRepo repo}) : _repo = repo;

  bool isLoading = false;
  String _email = '';
  String _resetToken = '';

  String get email => _email;

  Future<void> sendOtp(String email) async {
    if (isLoading) return;
    if (email.isEmpty) {
      showCustomSnackBar('fill_all_fields'.tr);
      return;
    }

    isLoading = true;
    update();
    final error = await _repo.sendOtp(email);
    isLoading = false;
    update();

    if (error != null) {
      showCustomSnackBar(error);
      return;
    }

    _email = email;
    showCustomSnackBar('otp_sent'.tr, isError: false);
    Get.toNamed(RouteHelper.getOtpVerificationRoute());
  }

  Future<void> resendOtp() async {
    if (_email.isEmpty) return;
    await sendOtp(_email);
  }

  Future<void> verifyOtp(String otp) async {
    if (isLoading) return;
    if (otp.length != 6) {
      showCustomSnackBar('invalid_otp'.tr);
      return;
    }

    isLoading = true;
    update();
    final (error, data) = await _repo.verifyOtp(_email, otp);
    isLoading = false;
    update();

    if (error != null) {
      showCustomSnackBar(error);
      return;
    }

    _resetToken = data!.token;
    Get.toNamed(RouteHelper.getResetPasswordRoute());
  }

  Future<void> resetPassword({required String newPassword, required String confirmPassword}) async {
    if (isLoading) return;
    if (newPassword.isEmpty || confirmPassword.isEmpty) {
      showCustomSnackBar('fill_all_fields'.tr);
      return;
    }
    if (newPassword != confirmPassword) {
      showCustomSnackBar('passwords_do_not_match'.tr);
      return;
    }
    if (newPassword.length < 6) {
      showCustomSnackBar('password_min_length'.tr);
      return;
    }

    isLoading = true;
    update();
    final error = await _repo.resetPassword(_resetToken, newPassword);
    isLoading = false;
    update();

    if (error != null) {
      showCustomSnackBar(error);
      return;
    }

    showCustomSnackBar('password_reset_success'.tr, isError: false);
    Get.offAllNamed(RouteHelper.getSignInRoute());
  }
}
