import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/auth/controller/auth_controller.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:get/get.dart';

class ApiChecker {
  static void checkApi(Response response) {
    if (response.statusCode == 401) {
      if (Get.currentRoute == RouteHelper.getSignInRoute()) return;
      Get.find<AuthController>().signOut();
      Get.offAllNamed(RouteHelper.getSignInRoute());
      showCustomSnackBar('session_expired'.tr);
    } else {
      showCustomSnackBar(response.statusText);
    }
  }
}
