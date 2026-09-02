import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/analytics/models/analytics_model.dart';
import 'package:lumen/features/analytics/repo/analytics_repo.dart';

class AnalyticsController extends GetxController implements GetxService {
  final AnalyticsRepo _repo;

  AnalyticsController({required AnalyticsRepo repo}) : _repo = repo;

  bool isLoading = false;
  AnalyticsModel? analytics;

  @override
  void onInit() {
    super.onInit();
    loadAnalytics();
  }

  Future<void> loadAnalytics() async {
    isLoading = true;
    update();

    final response = await _repo.fetchAnalytics();
    if (response.statusCode == 200 && response.body != null && response.body['analytics'] != null) {
      analytics = AnalyticsModel.fromJson(response.body['analytics']);
    } else {
      showCustomSnackBar('failed_to_load_analytics'.tr);
    }

    isLoading = false;
    update();
  }
}
