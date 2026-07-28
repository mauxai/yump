import 'package:get/get.dart';

class CreateAccountModel {
  final String name;
  final String email;
  final String password;

  const CreateAccountModel({
    required this.name,
    required this.email,
    required this.password,
  });

  String? validate() {
    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      return 'fill_all_fields'.tr;
    }

    if (!email.contains('@')) {
      return 'invalid_email'.tr;
    }

    if (password.length < 6) {
      return 'password_min_length'.tr;
    }

    return null;
  }
}
