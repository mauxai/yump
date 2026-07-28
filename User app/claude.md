# Context

## Project Formatting Rules
- Follow the user's visual ruler across the whole project.
- Keep signatures, short method bodies, and named arguments on one line when they fit.
- Wrap only the part that exceeds the ruler, and prefer manual, intentional line breaks.
- For `Row` or `Stack` and `Column`: if named args fit before `children:` on one line, write them all on the same opening line — `Row(mainAxisSize: MainAxisSize.min, children: [`. Closing `])` goes together on its own line. Leave a blank line between each child. Keep short named args (e.g. `width: 8, height: 8,`) on the same widget line.

## UI Style Rules
- Use `Roboto` as the app font and prefer shared theme/styles over per-widget custom font setup.
- Use `robotoLight`, `robotoRegular`, `robotoMedium`, or `robotoBold` and customize with `.copyWith(...)`.
- Use shared values from `lib/util/dimensions.dart` for font sizes, padding, spacing, and radius whenever practical.
- Prefer `Theme.of(context)` and `colorScheme` for background, surface, border, and text colors in views/widgets instead of fixed dark or light colors.
- Keep `AppColors` for shared brand colors, gradients, and special-purpose accent colors.

## Reusable Widget Rules
- Reuse repeated UI by creating custom widgets for common patterns like text fields, buttons, cards, and toasts.
- Place common widgets, models, and controllers in `lib/common`.
- If a view has multiple separate sections, split them into smaller widgets instead of keeping large private builder methods in the same screen file.
- Place feature-specific split widgets inside that feature's `widgets` folder, such as `lib/features/home/widgets`.

## Localization Rules
- Add every new translation key to all files in `assets/language` and keep them synchronized.
- Never use hardcoded user-facing strings anywhere in the project — not in views, widgets, controllers, models, or repos. Every string shown to the user must come from a translation key via `.tr` or `.trParams({...})`.
- For dynamic strings with a variable part, add a key with a `@paramName` placeholder and call `.trParams({'paramName': value})` at the call site (e.g. `'feature_coming_soon'.trParams({'feature': feature})`).
- Import `package:get/get.dart` in models or non-widget classes when `.tr` is needed there.

## API Architecture Rules
- Do not call any API directly from a view.
- Route API work through `View -> Controller -> Repository -> ApiClient`.
- Use controller functions for API actions, and use the existing `ApiClient` methods: `get`, `post`, `put`, `delete`, and `postMultipart`.
- Inject repositories through controller constructors from `dependency_injection.dart` instead of calling `Get.find()` inside controllers for repositories.

## GetX State Rules
- Use `GetBuilder` instead of `Obx`.
- Use plain controller variables with `update()` instead of `.obs` and `Rx` types.
- Keep view state updates inside the controller, not inline in the widget tree.
- Views must extend `GetView<ControllerType>` — not `StatelessWidget` or `StatefulWidget`.

## Routing Rules
- Define all route name strings and getter functions in `lib/helper/route_helper.dart`.
- Navigate with `Get.toNamed(RouteHelper.getXxxRoute(...))` — never hardcode route strings inline.
- Pass route parameters as query params (URI-encoded for paths/strings) and decode them in the `GetPage` builder.

## Constants and Endpoints Rules
- Store all API endpoint path strings as `static const String` fields on `AppConstants` in `lib/util/app_constants.dart`.
- Store `SharedPreferences` keys, app-wide config values, and feature flags on `AppConstants` as well.

## File Naming Rules
- Use snake_case for all file names.
- Suffix files by their role: `_view.dart`, `_controller.dart`, `_repo.dart`, `_model.dart`, `_widget.dart`.

## Error Display Rules
- Always use `showCustomSnackBar(message)` from `lib/common/widgets/custom_snackbar_widget.dart` for all user-facing messages — never use `Get.snackbar(...)` anywhere in the project.
- Pass `isError: false` for non-error feedback (success, coming soon, info); the default `isError: true` styles the toast as an error.
- Use `CustomToast` (in `lib/common/widgets/`) for brief, non-blocking feedback.

## TextEditingController Rules
- Never initialize `TextEditingController` inside a `GetxController`. Controllers must stay free of Flutter widget lifecycle objects.
- Initialize and dispose `TextEditingController` in the `StatefulWidget` that owns the form fields — typically a feature-specific form section widget (e.g. `SignInFormSection`, `AuthFormSection`).
- Pass the current text values as plain `String` arguments when calling controller methods (e.g. `c.signInWithEmail(email: _emailController.text.trim(), password: _passwordController.text)`), not the controller object itself.

## Local Storage Rules
- All `SharedPreferences` reads and writes must go through a repo class — never access `SharedPreferences` directly from a controller or view.
- `AuthRepo` holds the `SharedPreferences` instance and exposes helpers for token, theme, and language. Other repos receive `AuthRepo` via constructor to access it indirectly.
