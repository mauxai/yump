import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/auth/model/create_account_model.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/helper/route_helper.dart';

class AuthController extends GetxController implements GetxService {
  final AuthRepo _authRepo;

  AuthController({required AuthRepo authRepo}) : _authRepo = authRepo;

  bool isGoogleLoading = false;
  bool isEmailLoading = false;
  bool get isAnyLoading => isGoogleLoading || isEmailLoading;

  bool get isRememberMe => _authRepo.isRememberMe;
  String? get rememberedEmail => _authRepo.rememberedEmail;
  String? get rememberedPassword => _authRepo.rememberedPassword;

  Future<void> signInWithGoogle() async {
    if (isAnyLoading) return;

    isGoogleLoading = true;
    update();
    final success = await _authRepo.signInWithGoogle();
    isGoogleLoading = false;
    update();

    if (success) {
      _refreshProfile();
      updateToken();
      Get.offAllNamed(RouteHelper.getDashboardRoute());
    }
  }

  Future<void> updateToken() async {
    await _authRepo.updateToken();
  }

  Future<void> signOut() async {
    await _authRepo.signOut();
    update();
  }

  Future<void> signInWithEmail({required String email, required String password, bool rememberMe = false}) async {
    if (isAnyLoading) return;

    if (email.isEmpty || password.isEmpty) {
      _showError('fill_all_fields'.tr);
      return;
    }

    isEmailLoading = true;
    update();
    final error = await _authRepo.signInWithEmail(email: email, password: password);
    isEmailLoading = false;
    update();

    if (error != null) {
      _showError(error);
      return;
    }

    if (rememberMe) {
      _authRepo.saveCredentials(email, password);
    } else {
      _authRepo.clearCredentials();
    }

    _refreshProfile();
    updateToken();
    Get.offAllNamed(RouteHelper.getDashboardRoute());
  }

  Future<void> createAccountWithEmail({required String name, required String email, required String password}) async {
    if (isAnyLoading) return;

    final account = CreateAccountModel(name: name, email: email, password: password);

    final validationMessage = account.validate();
    if (validationMessage != null) {
      _showError(validationMessage);
      return;
    }

    isEmailLoading = true;
    update();
    final error = await _authRepo.createAccountWithEmail(account);
    isEmailLoading = false;
    update();

    if (error != null) {
      _showError(error);
      return;
    }

    _refreshProfile();
    updateToken();
    Get.offAllNamed(RouteHelper.getDashboardRoute());
  }

  void _refreshProfile() => Get.find<ProfileController>().fetchProfile();

  void _showError(String message) {
    showCustomSnackBar(message);
  }
}
