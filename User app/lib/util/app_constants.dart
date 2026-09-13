import 'package:flutter/material.dart';
import 'package:lumen/common/models/language_model.dart';
import 'package:lumen/util/enums.dart';


class AppConstants {
  static const String appName = 'Yumpass AI';
  static const String appVersion = "1.0"; ///Flutter SDK: 3.44.2

  static const String baseUrl = 'https://ai.yumpass.in';

  static const String configUri = '/api/v1/config';
  static const String signUpWithEmailUri = '/api/v1/auth/register';
  static const String signInWithEmailUri = '/api/v1/auth/login';
  static const String signInWithSocialMediaUri = '/api/v1/auth/social';
  static const String profileUri = '/api/v1/user/profile';
  static const String updateProfileUri = '/api/v1/user/profile';
  static const String createProjectUri = '/api/v1/projects';
  static const String deleteProjectUri = '/api/v1/projects';
  static const String projectListUri = '/api/v1/projects';
  static const String projectDetailsUri = '/api/v1/projects/';
  static const String promtSuggestionsUrl = '/api/v1/editor/suggestions';
  static const String applyEditUrl = '/api/v1/projects/';
  static const String forgotPasswordUri = '/api/v1/auth/forgot-password';
  static const String verifyOtpUri = '/api/v1/auth/verify-otp';
  static const String resetPasswordUri = '/api/v1/auth/reset-password';
  static const String activityUri = '/api/v1/user/activity';
  static const String planListUri = '/api/v1/billing/plans';
  static const String gatewayListUri = '/api/v1/billing/gateways';
  static const String purchasePlanUri = '/api/v1/billing/checkout';
  static const String billingHistoryUri = '/api/v1/billing/history';
  static const String exportHistoryUri = '/api/v1/billing/export';
  static const String aiProvidersUri = '/api/v1/ai/providers';
  static const String editorEffectsUri = '/api/v1/editor/effects';
  static const String templatesUri = '/api/v1/templates';
  static const String tokenUrl = '/api/v1/user/update-fcm-token';
  static const String notificationsUri = '/api/v1/notifications';
  static const String notificationReadUri = '/api/v1/notifications/read';

  // Multimodal AI Chat
  static const String chatUri = '/api/v1/chat';
  static const String conversationsUri = '/api/v1/conversations';
  static const String chatFeedbackUri = '/api/v1/chat/feedback';
  static const String chatAttachmentUploadUri = '/api/v1/attachments/upload';

  // Video Studio
  static const String videoGenerateUri = '/api/v1/video/generate';
  static const String videoStatusUri = '/api/v1/video/'; // + [id] + /status
  static const String videoGalleryUri = '/api/v1/video/gallery';
  static const String videoModelsUri = '/api/v1/video/models';
  static const String videoDeleteUri = '/api/v1/video/'; // + [id] (DELETE)

  // Cloud Gallery
  static const String cloudGalleryUri = '/api/v1/gallery';

  // Account Security & Settings
  static const String changePasswordUri = '/api/v1/user/change-password';
  static const String changeEmailUri = '/api/v1/user/change-email';
  static const String deleteAccountUri = '/api/v1/user/profile';
  static const String analyticsUri = '/api/v1/user/analytics';



  /// Shared Key
  static const String theme = 'theme';
  static const String intro = 'intro';
  static const String token = 'login_token';
  static const String languageCode = 'language_code';
  static const String localizationKey = 'X-localization';
  static const String savedEmail = 'saved_email';
  static const String savedPassword = 'saved_password';
  static const String rememberMe = 'remember_me';
  static const String selectedAiModelId = 'selected_ai_model_id';



  static List<LanguageModel> languages = [
    LanguageModel(languageName: 'English', countryCode: 'US', languageCode: 'en'),
    LanguageModel(languageName: 'অসমীয়া', countryCode: 'IN', languageCode: 'as'),
    LanguageModel(languageName: 'Bengali', countryCode: 'BD', languageCode: 'bn'),
  ];


  static const bool currencySymbolLeft = true;
  static const int maxPromptLength = 200;
  static const double minCropSize = 40.0;
  static const double cropHandleHitRadius = 26.0;

  static const List<Map<String, Object>> editorTools = [
    {'id': EditorTool.lasso, 'label': 'tool_lasso', 'icon': Icons.gesture},
    {'id': EditorTool.brush, 'label': 'tool_draw',  'icon': Icons.edit_rounded},
    {'id': EditorTool.crop,  'label': 'tool_crop',  'icon': Icons.crop_rounded},
    {'id': EditorTool.shape, 'label': 'tool_shape', 'icon': Icons.interests_rounded},
    {'id': EditorTool.heal,  'label': 'tool_heal',  'icon': Icons.healing_rounded},
    {'id': EditorTool.color, 'label': 'tool_color', 'icon': Icons.tune_rounded},
  ];

  static const List<Map<String, String>> cropAspectRatios = [
    {'label': 'Free', 'value': 'free'},
    {'label': '1:1', 'value': '1:1'},
    {'label': '4:3', 'value': '4:3'},
    {'label': '16:9', 'value': '16:9'},
    {'label': '9:16', 'value': '9:16'},
    {'label': '3:4', 'value': '3:4'},
  ];


}
