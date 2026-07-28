import 'package:get/get.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';

class ThemeController extends GetxController {
  final AuthRepo _authRepo;
  bool _darkTheme = true;
  bool get darkTheme => _darkTheme;

  ThemeController({required AuthRepo authRepo}) : _authRepo = authRepo;

  @override
  void onInit() {
    super.onInit();
    _loadCurrentTheme();
  }

  void toggleTheme() {
    _darkTheme = !_darkTheme;
    _authRepo.saveString('theme_mode', _darkTheme ? 'dark' : 'light');
    update();
  }

  void setTheme(bool isDark) {
    _darkTheme = isDark;
    _authRepo.saveString('theme_mode', isDark ? 'dark' : 'light');
    update();
  }

  void _loadCurrentTheme() {
    final saved = _authRepo.getString('theme_mode');
    _darkTheme = saved != 'light';
    update();
  }
}
