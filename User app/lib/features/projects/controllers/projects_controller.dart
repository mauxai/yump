import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/helper/route_helper.dart';
import 'package:lumen/features/projects/model/project_model.dart';
import 'package:lumen/features/projects/model/project_paginated_response_model.dart';
import 'package:lumen/features/projects/repo/projects_repo.dart';

class ProjectsController extends GetxController implements GetxService{
  final ProjectsRepo _projectsRepo;

  ProjectsController({required ProjectsRepo projectsRepo}) : _projectsRepo = projectsRepo;

  bool isLoadingMore = false;
  bool isGridView = false;
  int _currentPage = 1;
  int _totalPages = 1;
  static const int _pageSize = 20;
  List<Projects>? _apiProjects;

  List<Projects>? get apiProjects => _apiProjects == null ? null : List.unmodifiable(_apiProjects!);
  bool get hasMore => _currentPage < _totalPages;

  List<ProjectModel> get projects => _projectsRepo.projects;

  @override
  void onInit() {
    super.onInit();
    loadProjects();
  }

  Future<void> loadProjects({bool shouldUpdate = true}) async {
    _currentPage = 1;
    _apiProjects = null;
    if(shouldUpdate){
      update();
    }

    final response = await _projectsRepo.getProjects(page: _currentPage, pageSize: _pageSize);

    if (response.statusCode == 200 && response.body != null) {
      final parsed = ProjectsPaginatedResponse.fromJson(response.body);
      _apiProjects = List.of(parsed.projects ?? []);
      _totalPages = parsed.totalPages ?? 1;
    } else {
      _apiProjects = [];
    }

    update();
  }

  Future<void> loadMore() async {
    if (isLoadingMore || !hasMore) return;

    isLoadingMore = true;
    _currentPage++;
    update();

    final response = await _projectsRepo.getProjects(page: _currentPage, pageSize: _pageSize);

    if (response.statusCode == 200 && response.body != null) {
      final parsed = ProjectsPaginatedResponse.fromJson(response.body);
      _apiProjects!.addAll(parsed.projects ?? []);
      _totalPages = parsed.totalPages ?? 1;
    } else {
      _currentPage--;
    }

    isLoadingMore = false;
    update();
  }

  void toggleView() {
    isGridView = !isGridView;
    update();
  }

  Future<void> deleteProject(String id) async {
    final response = await _projectsRepo.deleteProject(id);
    if (response.statusCode == 200 || response.statusCode == 204) {
      _apiProjects!.removeWhere((p) => p.id == id);
      update();
      showCustomSnackBar('project_deleted'.tr, isError: false);
    } else {
      showCustomSnackBar('delete_project_failed'.tr);
    }
  }

  void refreshProjects() {
    loadProjects();
  }

  void openProject(String imagePath, String projectName, {String? projectId}) {
    Get.toNamed(
      RouteHelper.getEditorRoute(
        imagePath: imagePath,
        projectName: projectName,
        projectId: projectId,
      ),
    );
  }
}
