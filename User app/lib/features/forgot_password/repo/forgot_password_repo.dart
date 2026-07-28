import 'package:get/get.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/forgot_password/model/verify_otp_response.dart';
import 'package:lumen/util/app_constants.dart';

class ForgotPasswordRepo {
  final ApiClient apiClient;

  ForgotPasswordRepo({required this.apiClient});

  String _extractError(Response response, String fallback) {
    if (response.body is Map<String, dynamic>) {
      final msg = response.body['message'] ?? response.body['error'];
      if (msg != null) return msg.toString();
    }
    return response.statusText ?? fallback;
  }

  Future<String?> sendOtp(String email) async {
    final response = await apiClient.postData(
      AppConstants.forgotPasswordUri,
      {'email': email},
      handleError: false,
    );
    if (response.statusCode == 200) return null;
    return _extractError(response, 'otp_send_failed'.tr);
  }

  Future<(String? error, VerifyOtpResponse? data)> verifyOtp(String email, String otp) async {
    final response = await apiClient.postData(
      AppConstants.verifyOtpUri,
      {'email': email, 'otp': otp},
      handleError: false,
    );
    if (response.statusCode == 200 && response.body is Map<String, dynamic>) {
      final data = VerifyOtpResponse.fromJson(response.body as Map<String, dynamic>);
      if (data.ok && data.token.isNotEmpty) return (null, data);
    }
    return (_extractError(response, 'invalid_otp'.tr), null);
  }

  Future<String?> resetPassword(String resetToken, String newPassword) async {
    final response = await apiClient.postData(
      AppConstants.resetPasswordUri,
      {'token': resetToken, 'password': newPassword},
      handleError: false,
    );
    if (response.statusCode == 200) return null;
    return _extractError(response, 'password_reset_failed'.tr);
  }
}
