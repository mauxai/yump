import 'package:flutter_test/flutter_test.dart';
import 'package:lumen/core/theme/theme_controller.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';

class MockAuthRepo extends Fake implements AuthRepo {
  final Map<String, String> storage;

  MockAuthRepo({Map<String, String>? initialStorage})
      : storage = initialStorage ?? {};

  @override
  void saveString(String key, String value) {
    storage[key] = value;
  }

  @override
  String? getString(String key) {
    return storage[key];
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ThemeController Tests', () {
    test('Default mode is light mode when no preference is saved', () {
      final mockAuthRepo = MockAuthRepo();
      final controller = ThemeController(authRepo: mockAuthRepo);

      expect(controller.darkTheme, isFalse,
          reason: 'Initial darkTheme property should be false (light mode by default)');

      controller.onInit();

      expect(controller.darkTheme, isFalse,
          reason: 'After onInit with no stored preference, darkTheme should remain false');
    });

    test('Loads dark mode when "dark" is saved in storage', () {
      final mockAuthRepo = MockAuthRepo(initialStorage: {'theme_mode': 'dark'});
      final controller = ThemeController(authRepo: mockAuthRepo);

      controller.onInit();

      expect(controller.darkTheme, isTrue,
          reason: 'Should load dark mode when "dark" is saved in preference');
    });

    test('Loads light mode when "light" is saved in storage', () {
      final mockAuthRepo = MockAuthRepo(initialStorage: {'theme_mode': 'light'});
      final controller = ThemeController(authRepo: mockAuthRepo);

      controller.onInit();

      expect(controller.darkTheme, isFalse,
          reason: 'Should load light mode when "light" is saved in preference');
    });

    test('setTheme(true) enables dark mode and saves "dark"', () {
      final mockAuthRepo = MockAuthRepo();
      final controller = ThemeController(authRepo: mockAuthRepo);
      controller.onInit();

      expect(controller.darkTheme, isFalse);

      controller.setTheme(true);

      expect(controller.darkTheme, isTrue);
      expect(mockAuthRepo.storage['theme_mode'], 'dark');
    });

    test('setTheme(false) enables light mode and saves "light"', () {
      final mockAuthRepo = MockAuthRepo(initialStorage: {'theme_mode': 'dark'});
      final controller = ThemeController(authRepo: mockAuthRepo);
      controller.onInit();

      expect(controller.darkTheme, isTrue);

      controller.setTheme(false);

      expect(controller.darkTheme, isFalse);
      expect(mockAuthRepo.storage['theme_mode'], 'light');
    });

    test('toggleTheme switches from light mode to dark mode and back', () {
      final mockAuthRepo = MockAuthRepo();
      final controller = ThemeController(authRepo: mockAuthRepo);
      controller.onInit();

      // Initially light mode
      expect(controller.darkTheme, isFalse);

      // Toggle to dark
      controller.toggleTheme();
      expect(controller.darkTheme, isTrue);
      expect(mockAuthRepo.storage['theme_mode'], 'dark');

      // Toggle back to light
      controller.toggleTheme();
      expect(controller.darkTheme, isFalse);
      expect(mockAuthRepo.storage['theme_mode'], 'light');
    });
  });
}
