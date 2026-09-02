import 'package:get/get.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/features/auth/view/sign_up_view.dart';
import 'package:lumen/features/auth/view/sign_in_view.dart';
import 'package:lumen/features/dashboard/views/dashboard_view.dart';
import 'package:lumen/features/editor/views/editor_view.dart';
import 'package:lumen/features/notification/views/notification_view.dart';
import 'package:lumen/features/onboarding/views/onboarding_view.dart';
import 'package:lumen/features/forgot_password/views/forgot_password_view.dart';
import 'package:lumen/features/forgot_password/views/otp_verification_view.dart';
import 'package:lumen/features/forgot_password/views/reset_password_view.dart';
import 'package:lumen/features/profile/views/edit_profile_view.dart';
import 'package:lumen/features/update/views/update_view.dart';
import 'package:lumen/features/upgrade/views/upgrade_view.dart';
import 'package:lumen/features/chat/views/chat_view.dart';
import 'package:lumen/features/video_studio/views/video_studio_view.dart';
import 'package:lumen/features/creations/views/creations_view.dart';
import 'package:lumen/features/analytics/views/analytics_view.dart';

class RouteHelper {
  static const String initial = '/';
  static const String createAccount = '/create-account';
  static const String signIn = '/sign-in';
  static const String dashboard = '/dashboard';
  static const String chat = '/chat';
  static const String videoStudio = '/video-studio';
  static const String creations = '/creations';
  static const String analytics = '/analytics';
  static const String upgrade = '/upgrade';
  static const String editor = '/editor';
  static const String notification = '/notification';
  static const String editProfile = '/edit-profile';
  static const String forgotPassword = '/forgot-password';
  static const String otpVerification = '/otp-verification';
  static const String resetPassword = '/reset-password';
  static const String forceUpdate = '/force-update';

  static String getInitialRoute() => initial;
  static String getCreateAccountRoute() => createAccount;
  static String getSignInRoute() => signIn;
  static String getDashboardRoute({int pageIndex = 0}) => '$dashboard?pageIndex=$pageIndex';
  static String getChatRoute() => chat;
  static String getVideoStudioRoute() => videoStudio;
  static String getCreationsRoute() => creations;
  static String getAnalyticsRoute() => analytics;
  static String getUpgradeRoute() => upgrade;
  static String getNotificationRoute() => notification;
  static String getEditProfileRoute() => editProfile;
  static String getForgotPasswordRoute() => forgotPassword;
  static String getOtpVerificationRoute() => otpVerification;
  static String getResetPasswordRoute() => resetPassword;
  static String getForceUpdateRoute() => forceUpdate;
  static String getEditorRoute({required String imagePath, required String projectName, bool isNewProject = false, String? initialPrompt, String? projectId, bool fromNotification = false}) {
    final encodedImagePath = Uri.encodeComponent(imagePath);
    final encodedProjectName = Uri.encodeComponent(projectName);
    final encodedPrompt = initialPrompt == null ? null : Uri.encodeComponent(initialPrompt);
    final encodedProjectId = projectId == null ? null : Uri.encodeComponent(projectId);
    return '$editor?imagePath=$encodedImagePath&projectName=$encodedProjectName&isNewProject=$isNewProject'
        '${encodedPrompt == null ? '' : '&initialPrompt=$encodedPrompt'}'
        '${encodedProjectId == null ? '' : '&projectId=$encodedProjectId'}'
        '${fromNotification ? '&fromNotification=true' : ''}';
  }

  static final List<GetPage> routes = [
    GetPage(name: initial, page: () => const OnboardingView()),
    GetPage(name: createAccount, page: () => const SignUpView()),
    GetPage(name: signIn, page: () => const SignInView()),
    GetPage(
      name: dashboard,
      page: () => DashboardView(
        pageIndex: int.tryParse(Get.parameters['pageIndex'] ?? '0') ?? 0,
        purchasedPlan: Get.arguments is Plan ? Get.arguments as Plan : null,
      ),
    ),
    GetPage(name: chat, page: () => const ChatView()),
    GetPage(name: videoStudio, page: () => const VideoStudioView()),
    GetPage(name: creations, page: () => const CreationsView()),
    GetPage(name: analytics, page: () => const AnalyticsView()),
    GetPage(name: upgrade, page: () => const UpgradeView()),
    GetPage(
      name: editor,
      page: () => EditorView(
        imagePath: Uri.decodeComponent(Get.parameters['imagePath'] ?? ''),
        projectName: Uri.decodeComponent(Get.parameters['projectName'] ?? 'Untitled'),
        initialPrompt: Get.parameters['initialPrompt'] == null ? null : Uri.decodeComponent(Get.parameters['initialPrompt']!),
        projectId: Get.parameters['projectId'] == null ? null : Uri.decodeComponent(Get.parameters['projectId']!),
        fromNotification: Get.parameters['fromNotification'] == 'true',
      ),
    ),
    GetPage(name: notification, page: () => const NotificationView()),
    GetPage(name: editProfile, page: () => const EditProfileView()),
    GetPage(name: forgotPassword, page: () => const ForgotPasswordView()),
    GetPage(name: otpVerification, page: () => const OtpVerificationView()),
    GetPage(name: resetPassword, page: () => const ResetPasswordView()),
    GetPage(name: forceUpdate, page: () => const UpdateView()),
  ];
}
