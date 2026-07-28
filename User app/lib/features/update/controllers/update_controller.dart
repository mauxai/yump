import 'package:get/get.dart';
import 'package:lumen/common/controller/config_controller.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:url_launcher/url_launcher.dart';

class UpdateController extends GetxController {
  bool isLaunching = false;

  String get downloadLink => Get.find<ConfigController>().appDownloadLink;

  Future<void> launchStore() async {
    final url = downloadLink.trim();
    if (url.isEmpty) {
      showCustomSnackBar('update_link_unavailable'.tr);
      return;
    }
    isLaunching = true;
    update();
    try {
      final launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      if (!launched) showCustomSnackBar('update_link_unavailable'.tr);
    } catch (_) {
      showCustomSnackBar('update_link_unavailable'.tr);
    } finally {
      isLaunching = false;
      update();
    }
  }
}
