import 'package:get/get.dart';
import 'package:lumen/common/controller/config_controller.dart';
import 'package:lumen/util/app_constants.dart';

class PriceConverter {
  static String convertPrice(double? price) {
    final symbol = Get.find<ConfigController>().config?.general?.currencySymbol ?? '';
    final amount = (price ?? 0.0).toStringAsFixed(2);
    return AppConstants.currencySymbolLeft ? '$symbol $amount' : '$amount $symbol';
  }
}