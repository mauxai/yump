import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/common/widgets/custom_loader.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/upgrade/models/paginated_billing_model.dart';
import 'package:lumen/features/upgrade/models/payment_gateways_model.dart';
import 'package:lumen/features/upgrade/models/plan_response_model.dart';
import 'package:lumen/features/upgrade/repo/upgrade_repo.dart';
import 'package:lumen/features/upgrade/views/payment_screen.dart';

enum PlanButtonState { active, purchaseAgain, upgrade, downgrade }

class UpgradeController extends GetxController implements GetxService {
  final UpgradeRepo _repo;

  UpgradeController({required UpgradeRepo repo}) : _repo = repo;

  List<Plan> plans = [];
  bool isLoading = false;

  List<Gateways> gateways = [];
  bool isLoadingGateways = false;
  Gateways? selectedGateway;

  Plan? get _currentPlan => Get.find<ProfileController>().user?.currentPlan;

  int get _creditsLeft {
    final user = Get.find<ProfileController>().user;
    return (user?.creditsTotal ?? 0) - (user?.creditsUsed ?? 0);
  }

  @override
  void onInit() {
    super.onInit();
    fetchPlans();
    fetchGateways();
    loadBillingHistory();
  }

  Future<void> fetchPlans() async {
    isLoading = true;
    update();
    final response = await _repo.getPlans();
    isLoading = false;
    if (response.statusCode == 200) {
      plans = PlanResponseModel.fromJson(response.body).plans ?? [];
    } else {
      showCustomSnackBar(response.body['message']?.toString() ?? 'error');
    }
    update();
  }

  Future<void> fetchGateways() async {
    isLoadingGateways = true;
    gateways = [];
    selectedGateway = null;
    update();
    final response = await _repo.getGateways();
    isLoadingGateways = false;
    if (response.statusCode == 200) {
      gateways = PaymentGateway.fromJson(response.body).gateways ?? [];
    } else {
      showCustomSnackBar(response.body['message']?.toString() ?? 'error');
    }
    update();
  }

  bool isCurrentPlan(Plan plan) => plan.id == _currentPlan?.id;

  PlanButtonState buttonState(Plan plan) {
    final current = _currentPlan;
    if (current == null) return PlanButtonState.upgrade;
    if (plan.id == current.id) {
      return _creditsLeft <= 0 ? PlanButtonState.purchaseAgain : PlanButtonState.active;
    }
    final planCredits = plan.credits ?? 0;
    final currentCredits = current.credits ?? 0;
    return planCredits < currentCredits ? PlanButtonState.downgrade : PlanButtonState.upgrade;
  }


  void selectGateway(Gateways gateway) {
    selectedGateway = gateway;
    update();
  }

  List<BillingModel> billingHistory = [];
  bool isLoadingBilling = false;
  bool isLoadingMoreBilling = false;
  int _billingPage = 1;
  int _billingTotalPages = 1;
  static const int _billingPageSize = 20;
  String billingSearch = '';
  String billingStatusFilter = '';

  bool get hasBillingMore => _billingPage < _billingTotalPages;

  Future<void> loadBillingHistory() async {
    isLoadingBilling = true;
    _billingPage = 1;
    billingHistory = [];
    update();
    final response = await _repo.getBillingHistory(
      page: _billingPage, pageSize: _billingPageSize,
      status: billingStatusFilter, search: billingSearch,
    );
    isLoadingBilling = false;
    if (response.statusCode == 200 && response.body != null) {
      final parsed = PaginatedBillingModel.fromJson(response.body);
      billingHistory = parsed.history ?? [];
      _billingTotalPages = parsed.pagination?.totalPages ?? 1;
    }
    update();
  }

  Future<void> loadMoreBillingHistory() async {
    if (isLoadingMoreBilling || !hasBillingMore) return;
    isLoadingMoreBilling = true;
    _billingPage++;
    update();
    final response = await _repo.getBillingHistory(
      page: _billingPage, pageSize: _billingPageSize,
      status: billingStatusFilter, search: billingSearch,
    );
    if (response.statusCode == 200 && response.body != null) {
      final parsed = PaginatedBillingModel.fromJson(response.body);
      billingHistory.addAll(parsed.history ?? []);
      _billingTotalPages = parsed.pagination?.totalPages ?? 1;
    } else {
      _billingPage--;
    }
    isLoadingMoreBilling = false;
    update();
  }

  void onBillingSearch(String query) {
    billingSearch = query;
    loadBillingHistory();
  }

  void clearBillingSearch() {
    billingSearch = '';
    loadBillingHistory();
  }

  void onBillingStatusFilter(String status) {
    billingStatusFilter = status;
    loadBillingHistory();
  }

  Future<void> downloadBillingExport() async {
    Get.dialog(const CustomLoader(), barrierDismissible: false);
    var uriStr = '${AppConstants.baseUrl}${AppConstants.exportHistoryUri}';
    final params = <String, String>{};
    if (billingStatusFilter.isNotEmpty) params['hs'] = billingStatusFilter;
    if (billingSearch.isNotEmpty) params['hq'] = billingSearch;
    final token = _repo.userToken;
    if (token != null) params['token'] = token;
    if (params.isNotEmpty) {
      uriStr += '?${params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
    }
    if (kDebugMode) print('Downloading billing export: $uriStr');
    try {
      final launched = await launchUrl(Uri.parse(uriStr));
      if (!launched) showCustomSnackBar('unable_to_download_invoice'.tr);
    } catch (_) {
      showCustomSnackBar('unable_to_download_invoice'.tr);
    } finally {
      if (Get.isDialogOpen == true) Get.back();
    }
  }

  bool isPurchasing = false;

  Future<void> purchasePlan({required Plan plan, required String gatewayId}) async {
    if (selectedGateway == null) {
      showCustomSnackBar('select_gateway'.tr);
      return;
    }
    isPurchasing = true;
    update();
    final response = await _repo.checkout(planId: plan.id!, gatewayId: gatewayId);
    isPurchasing = false;
    update();
    if (response.statusCode == 200) {
      final url = response.body['url']?.toString() ?? '';
      Get.to(() => PaymentScreen(url: url, plan: plan));
    } else {
      showCustomSnackBar(response.body['message']?.toString() ?? 'error');
    }
  }
}
