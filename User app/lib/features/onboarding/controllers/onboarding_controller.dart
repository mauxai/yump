import 'package:get/get.dart';
import 'package:lumen/common/controller/config_controller.dart';
import 'package:lumen/helper/route_helper.dart';

class OnboardingController extends GetxController {
  void goToCreateAccount() {
    Get.toNamed(RouteHelper.getCreateAccountRoute());
  }

  void getStarted() {
    if (Get.find<ConfigController>().isUpdateRequired) {
      Get.offAllNamed(RouteHelper.getForceUpdateRoute());
      return;
    }
    Get.offAllNamed(RouteHelper.getSignInRoute());
  }
}
