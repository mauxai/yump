import 'dart:io';
import 'package:gal/gal.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/gallery/models/cloud_edit_model.dart';
import 'package:lumen/features/gallery/repo/cloud_gallery_repo.dart';
import 'package:path_provider/path_provider.dart';

class CloudGalleryController extends GetxController implements GetxService {
  final CloudGalleryRepo _repo;

  CloudGalleryController({required CloudGalleryRepo repo}) : _repo = repo;

  bool isLoading = false;
  List<CloudEditModel> edits = [];
  List<Map<String, String>> projects = [];
  String? selectedProjectId;
  int page = 1;
  bool hasMore = true;

  @override
  void onInit() {
    super.onInit();
    loadGallery(refresh: true);
  }

  Future<void> loadGallery({bool refresh = false}) async {
    if (refresh) {
      page = 1;
      hasMore = true;
      edits.clear();
    }

    if (!hasMore && !refresh) return;

    isLoading = true;
    update();

    final response = await _repo.fetchGallery(page: page, projectId: selectedProjectId);
    if (response.statusCode == 200 && response.body != null) {
      final rawEdits = response.body['edits'] as List? ?? [];
      final newItems = rawEdits.map((e) => CloudEditModel.fromJson(e)).toList();
      edits.addAll(newItems);

      if (response.body['projects'] != null) {
        final rawProjects = response.body['projects'] as List;
        projects = rawProjects.map((p) => {'id': p['id'].toString(), 'name': p['name'].toString()}).toList();
      }

      final pagination = response.body['pagination'];
      if (pagination != null) {
        final totalPages = pagination['totalPages'] ?? 1;
        hasMore = page < totalPages;
        page++;
      } else {
        hasMore = false;
      }
    }

    isLoading = false;
    update();
  }

  void filterByProject(String? projectId) {
    selectedProjectId = projectId;
    loadGallery(refresh: true);
  }

  Future<void> downloadImage(String imageUrl, String editId) async {
    try {
      final res = await http.get(Uri.parse(imageUrl));
      final tempDir = await getTemporaryDirectory();
      final filePath = '${tempDir.path}/edit_$editId.png';
      final file = File(filePath);
      await file.writeAsBytes(res.bodyBytes);

      await Gal.putImage(filePath);
      showCustomSnackBar('image_saved_to_gallery'.tr, isError: false);
    } catch (_) {
      showCustomSnackBar('failed_to_save_image'.tr);
    }
  }
}
