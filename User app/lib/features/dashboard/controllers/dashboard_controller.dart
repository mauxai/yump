import 'package:get/get.dart';
import 'package:lumen/common/controller/ai_effect_model.dart';
import 'package:lumen/common/controller/ai_response_model.dart';
import 'package:lumen/common/controller/config_controller.dart';
import 'package:lumen/common/controller/template_model.dart';
import 'package:lumen/features/activity/controllers/activity_controller.dart';
import 'package:lumen/features/dashboard/repos/dashboard_repo.dart';
import 'package:lumen/features/notification/controllers/notification_controller.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/features/chat/controllers/chat_controller.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/features/dashboard/widgets/dashboard_create_sheet.dart';
import 'package:lumen/helper/route_helper.dart';

class DashboardController extends GetxController implements GetxService {
  final DashboardRepo _dashboardRepo;
  int currentIndex = 0;
  List<AiModel> aiModelList = [];
  AiEffectModel? effectModel;
  List<Templates> templates = [];

  DashboardController({required DashboardRepo dashboardRepo}) : _dashboardRepo = dashboardRepo;

  Future<void> checkForUpdate() async {
    final configController = Get.find<ConfigController>();
    if (configController.config == null) await configController.fetchConfig();
    if (configController.isUpdateRequired) {
      Get.offAllNamed(RouteHelper.getForceUpdateRoute());
    }
  }

  Future<void> fetchDashboardData() async {
    Get.find<ProfileController>().fetchProfile();
    Get.find<ProjectsController>().loadProjects(shouldUpdate: false);
    Get.find<ActivityController>().loadActivity(shouldUpdate: false);
    Get.find<NotificationController>().loadNotifications();
    await Future.wait([_fetchAiProviders(), _fetchEffects(), _fetchTemplates()]);
  }

  Future<void> _fetchAiProviders() async {
    final response = await _dashboardRepo.getAiProviders();
    if (response.statusCode == 200 && response.body != null) {
      aiModelList = AiResponseModel.fromJson(response.body).aiModelList ?? [];
      if (Get.isRegistered<ChatController>()) {
        Get.find<ChatController>().syncModelsFromDashboard(aiModelList);
      }
      update();
    }
  }

  Future<void> _fetchEffects() async {
    final response = await _dashboardRepo.getEffects();
    if (response.statusCode == 200 && response.body != null) {
      effectModel = AiEffectModel.fromJson(response.body);
      update();
    }
  }

  Future<void> _fetchTemplates() async {
    final response = await _dashboardRepo.getTemplates();
    if (response.statusCode == 200 && response.body != null) {
      templates = TemplateResponseModel.fromJson(response.body).templates ?? [];
      update();
    }
  }

  void changeTab(int index) {
    if (currentIndex == index) return;
    currentIndex = index;
    update();
  }

  void onFabTap() {
    Get.bottomSheet(
      const DashboardCreateSheet(),
      isScrollControlled: true,
    );
  }
}
