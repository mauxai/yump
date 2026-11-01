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

  // Image Studio (Text to Image)
  static const String imageGenerateUri = '/api/v1/image/generate';
  static const String imageModelsUri   = '/api/v1/image/models';
  static const String imageGalleryUri  = '/api/v1/image/gallery';

  // Video Studio
  static const String videoGenerateUri = '/api/v1/video/generate';
  static const String videoStatusUri = '/api/v1/video/'; // + [id] + /status
  static const String videoGalleryUri = '/api/v1/video/gallery';
  static const String videoModelsUri = '/api/v1/video/models';
  static const String videoDeleteUri = '/api/v1/video/'; // + [id] (DELETE)

  // Video Editing (Shotstack)
  static const String videoEditRenderUri = '/api/v1/video/edit/render';
  static const String videoEditUploadUri = '/api/v1/video/edit/upload';
  static const String videoEditStatusUri = '/api/v1/video/edit/'; // + [id] + /status
  static const String videoEditGalleryUri = '/api/v1/video/edit/gallery';
  static const String videoEditDeleteUri = '/api/v1/video/edit/'; // + [id] (DELETE)

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

  static const List<String> videoAspectRatios = ['16:9', '9:16', '1:1', '4:5', '4:3'];

  static const List<Map<String, String>> videoResolutions = [
    {'label': '1080p Full HD', 'value': '1080'},
    {'label': '720p HD', 'value': 'hd'},
    {'label': '576p SD', 'value': 'sd'},
    {'label': '360p Mobile', 'value': 'mobile'},
  ];

  static const List<String> videoFormats = ['mp4', 'gif'];

  static const List<Map<String, String>> videoTransitions = [
    {'label': 'none', 'value': ''},
    {'label': 'fade', 'value': 'fade'},
    {'label': 'wipe_left', 'value': 'wipeLeft'},
    {'label': 'wipe_right', 'value': 'wipeRight'},
    {'label': 'slide_left', 'value': 'slideLeft'},
    {'label': 'slide_right', 'value': 'slideRight'},
    {'label': 'slide_up', 'value': 'slideUp'},
    {'label': 'slide_down', 'value': 'slideDown'},
    {'label': 'carousel_left', 'value': 'carouselLeft'},
    {'label': 'carousel_right', 'value': 'carouselRight'},
  ];

  static const List<Map<String, String>> videoMotionEffects = [
    {'label': 'none', 'value': ''},
    {'label': 'motion_zoom_in', 'value': 'zoomIn'},
    {'label': 'motion_zoom_out', 'value': 'zoomOut'},
    {'label': 'motion_slide_left', 'value': 'slideLeftSlow'},
    {'label': 'motion_slide_right', 'value': 'slideRightSlow'},
    {'label': 'motion_slide_up', 'value': 'slideUpSlow'},
    {'label': 'motion_slide_down', 'value': 'slideDownSlow'},
  ];

  static const List<Map<String, String>> videoFitModes = [
    {'label': 'fit_cover', 'value': 'cover'},
    {'label': 'fit_contain', 'value': 'contain'},
    {'label': 'fit_crop', 'value': 'crop'},
  ];

  static const List<double> videoSpeedMultipliers = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  static const List<Map<String, String>> videoAudioFadeEffects = [
    {'label': 'fade_none', 'value': 'none'},
    {'label': 'fade_in', 'value': 'fadeIn'},
    {'label': 'fade_out', 'value': 'fadeOut'},
    {'label': 'fade_in_out', 'value': 'fadeInFadeOut'},
  ];

  static const List<Map<String, String>> videoWatermarkPositions = [
    {'label': 'pos_top_right', 'value': 'topRight'},
    {'label': 'pos_top_left', 'value': 'topLeft'},
    {'label': 'pos_bottom_right', 'value': 'bottomRight'},
    {'label': 'pos_bottom_left', 'value': 'bottomLeft'},
  ];

  static const List<Map<String, String>> videoFilters = [
    {'label': 'none', 'value': ''},
    {'label': 'filter_greyscale', 'value': 'greyscale'},
    {'label': 'filter_sepia', 'value': 'sepia'},
    {'label': 'filter_blur', 'value': 'blur'},
    {'label': 'filter_boost', 'value': 'boost'},
    {'label': 'filter_contrast', 'value': 'contrast'},
    {'label': 'filter_darken', 'value': 'darken'},
    {'label': 'filter_lighten', 'value': 'lighten'},
  ];

  static const List<Map<String, String>> videoTextStyles = [
    {'label': 'style_minimal', 'value': 'minimal'},
    {'label': 'style_block', 'value': 'block'},
    {'label': 'style_marker', 'value': 'marker'},
    {'label': 'style_future', 'value': 'future'},
  ];

  static const List<Map<String, String>> videoTextPositions = [
    {'label': 'pos_top_left', 'value': 'topLeft'},
    {'label': 'pos_top', 'value': 'top'},
    {'label': 'pos_top_right', 'value': 'topRight'},
    {'label': 'pos_left', 'value': 'left'},
    {'label': 'pos_center', 'value': 'center'},
    {'label': 'pos_right', 'value': 'right'},
    {'label': 'pos_bottom_left', 'value': 'bottomLeft'},
    {'label': 'pos_bottom', 'value': 'bottom'},
    {'label': 'pos_bottom_right', 'value': 'bottomRight'},
  ];

  static const List<Map<String, String>> videoTextSizes = [
    {'label': 'size_small', 'value': 'small'},
    {'label': 'size_medium', 'value': 'medium'},
    {'label': 'size_large', 'value': 'large'},
  ];

  static const List<Map<String, String>> videoTextBackgrounds = [
    {'label': 'bg_none', 'value': ''},
    {'label': 'bg_black', 'value': '#000000cc'},
    {'label': 'bg_white', 'value': '#ffffffcc'},
    {'label': 'bg_brand', 'value': '#6366f1dd'},
  ];
}
