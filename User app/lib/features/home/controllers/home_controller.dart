import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/common/models/api_error_response.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/home/models/promt_suggeston_model.dart';
import 'package:lumen/features/home/repo/home_repo.dart';
import 'package:lumen/features/home/widgets/home_create_project_sheet_widget.dart';
import 'package:lumen/features/projects/controllers/projects_controller.dart';
import 'package:lumen/features/projects/model/project_model.dart';
import 'package:lumen/features/projects/model/project_paginated_response_model.dart';
import 'package:lumen/features/projects/repo/projects_repo.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:photo_manager/photo_manager.dart';

class HomeController extends GetxController implements GetxService{
  final ProjectsRepo _projectsRepo;
  final HomeRepo _homeRepo;
  final _picker = ImagePicker();

  HomeController({required ProjectsRepo projectsRepo, required HomeRepo homeRepo})
      : _projectsRepo = projectsRepo,
        _homeRepo = homeRepo;

  String pickedImagePath = '';
  bool isCreatingProject = false;
  final List<AssetEntity> galleryImages = [];
  bool hasGalleryPermission = false;

  List<String>? suggestions;
  bool isLoadingSuggestions = false;

  List<ProjectModel> get recentProjects => _projectsRepo.projects;

  @override
  void onInit() {
    super.onInit();
    Future.delayed(Duration.zero, requestGalleryPermission);
    fetchSuggestions();
  }

  Future<void> fetchSuggestions() async {

    final response = await _homeRepo.getSuggestions();
    if (response.statusCode == 200) {
      suggestions = [];
      final model = PromtSuggestions.fromJson(response.body);
      suggestions = model.suggestions ?? [];
    }
    update();
  }

  Future<void> requestGalleryPermission() async {
    final permission = await PhotoManager.requestPermissionExtend();
    hasGalleryPermission = permission.isAuth || permission.hasAccess;
    update();
    if (hasGalleryPermission) {
      await _loadGalleryImages();
    }
  }

  Future<void> _loadGalleryImages() async {
    final albums = await PhotoManager.getAssetPathList(
      type: RequestType.image,
      filterOption: FilterOptionGroup(
        orders: [
          const OrderOption(type: OrderOptionType.createDate, asc: false),
        ],
      ),
    );
    if (albums.isEmpty) return;
    final assets = await albums.first.getAssetListRange(start: 0, end: 10);
    galleryImages..clear()..addAll(assets);
    update();
  }

  Future<void> pickFromCamera() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.camera);
      if (image != null) {
        pickedImagePath = image.path;
        update();
        showCreateProjectSheet(image.path);
      }
    } catch (e) {
      showCustomSnackBar(e.toString());
    }
  }

  Future<void> pickFromGallery() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        pickedImagePath = image.path;
        update();
        showCreateProjectSheet(image.path);
      }
    } catch (e) {
      showCustomSnackBar(e.toString());
    }
  }

  void showCreateProjectSheet(String imagePath, {String? initialPrompt}) {
    Get.bottomSheet(
      HomeCreateProjectSheet(imagePath: imagePath, initialPrompt: initialPrompt),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enableDrag: true,
    );
  }

  Future<void> createProject(String name, String imagePath, {String? initialPrompt}) async {
    final effectiveName = name.trim().isEmpty || name.trim() == '.'
        ? 'untitled_project'.tr
        : name.trim();
    isCreatingProject = true;
    update(['create_project']);

    final response = await _projectsRepo.createProjectFromPath(effectiveName, imagePath);

    if (response.statusCode == 200 || response.statusCode == 201) {
      final project = Projects.fromJson(response.body['project']);
      isCreatingProject = false;
      update(['create_project']);
      Get.back();
      Get.find<ProjectsController>().refreshProjects();
      _navigateToEditScreen(
        project.thumbnailUrl ?? imagePath,
        project.name ?? name,
        projectId: project.id,
        initialPrompt: initialPrompt,
      );
    } else {
      _showApiErrors(response.body, 'create_project_failed'.tr);
      isCreatingProject = false;
      update(['create_project']);
    }
  }

  void _showApiErrors(dynamic body, String fallback) {
    try {
      final apiError = ApiErrorResponse.fromJson(body);
      final List<String> all = apiError.allErrors;
      if (all.isNotEmpty) {
        showCustomSnackBar(all.join('\n'));
        return;
      }
      showCustomSnackBar(apiError.displayMessage(fallback));
    } catch (_) {
      showCustomSnackBar(fallback);
    }
  }

  Future<void> pickFromGalleryWithPrompt(String prompt) async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        pickedImagePath = image.path;
        update();
        showCreateProjectSheet(image.path, initialPrompt: prompt);
      }
    } catch (e) {
      showCustomSnackBar(e.toString());
    }
  }

  Future<void> openGalleryAsset(AssetEntity asset) async {
    final file = await asset.file;
    if (file == null) return;
    showCreateProjectSheet(file.path);
  }

  void openProject(String imagePath, String projectName, {String? projectId}) {
    _navigateToEditScreen(imagePath, projectName, projectId: projectId);
  }

  Future<void> deleteProject(String id, ProjectModel project) async {
    final response = await _projectsRepo.deleteProject(id);
    if (response.statusCode == 200 || response.statusCode == 204) {
      _projectsRepo.projects.remove(project);
      update();
      showCustomSnackBar('project_deleted'.tr, isError: false);
    } else {
      showCustomSnackBar('delete_project_failed'.tr);
    }
  }

  void refreshProjects() {
    update();
  }

  void _navigateToEditScreen(
    String imagePath,
    String projectName, {
    bool isNewProject = false,
    String? initialPrompt,
    String? projectId,
  }) {
    Get.toNamed(
      RouteHelper.getEditorRoute(
        imagePath: imagePath,
        projectName: projectName,
        isNewProject: isNewProject,
        initialPrompt: initialPrompt,
        projectId: projectId,
      ),
    );
  }
}
