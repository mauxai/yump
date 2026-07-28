import 'dart:developer';
import 'package:get/get.dart';
import 'package:lumen/common/models/config_model.dart';
import 'package:lumen/common/repo/config_repo.dart';
import 'package:lumen/util/app_constants.dart';

class ConfigController extends GetxController implements GetxService {
  final ConfigRepo _configRepo;

  ConfigController({required ConfigRepo configRepo}) : _configRepo = configRepo;

  ConfigModel? config;
  bool isLoading = false;

  bool get isDemoMode => config?.isDemo ?? false;

  /// Minimum version required by the server for the current platform.
  String get minimumAppVersion =>
      (GetPlatform.isIOS ? config?.iosMinimumAppVersion : config?.androidMinimumAppVersion) ?? '';

  /// Store / download link for the current platform.
  String get appDownloadLink =>
      (GetPlatform.isIOS ? config?.iosAppDownloadLink : config?.androidAppDownloadLink) ?? '';

  /// `true` when the server's minimum version is newer than the installed app.
  bool get isUpdateRequired {
    if (minimumAppVersion.isEmpty) return false;
    return _compareVersion(minimumAppVersion, AppConstants.appVersion) > 0;
  }

  /// Compares two dotted version strings (e.g. `1`, `1.0`, `1.0.0`).
  /// Returns 1 if [a] > [b], -1 if [a] < [b], 0 if equal.
  int _compareVersion(String a, String b) {
    final aParts = a.split('.');
    final bParts = b.split('.');
    final length = aParts.length > bParts.length ? aParts.length : bParts.length;
    for (int i = 0; i < length; i++) {
      final aValue = i < aParts.length ? int.tryParse(aParts[i].trim()) ?? 0 : 0;
      final bValue = i < bParts.length ? int.tryParse(bParts[i].trim()) ?? 0 : 0;
      if (aValue != bValue) return aValue > bValue ? 1 : -1;
    }
    return 0;
  }

  @override
  void onInit() {
    super.onInit();
    fetchConfig();
  }

  Future<void> fetchConfig() async {
    final response = await _configRepo.getConfig();
    if (response.statusCode == 200 && response.body != null) {
      config = ConfigModel.fromJson(response.body);
    }
    log(name: "CONFIG", "Data : ${response.body}");
    update();
  }
}
