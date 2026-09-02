import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/features/auth/model/create_account_model.dart';
import 'package:lumen/util/app_constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthRepo {
  final SharedPreferences sharedPreferences;
  final ApiClient apiClient;
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);

  AuthRepo({required this.sharedPreferences, required this.apiClient});

  bool get isLoggedIn => sharedPreferences.getString(AppConstants.token) != null ;

  void _saveAuthData(AuthResponse authResponse) {
    saveString(AppConstants.token, authResponse.token!);
    apiClient.updateHeader(authResponse.token, getString(AppConstants.languageCode));
  }

  String _extractError(Response response, String fallback) {
    if (response.body is Map<String, dynamic>) {
      final msg = response.body['error'];
      if (msg != null) return msg.toString();
    }
    return fallback;
  }

  Future<bool> signInWithGoogle() async {
    try {
      final account = await _googleSignIn.signIn();
      if (account == null) return false;

      String? errorMessage = await _signInWithSocialMedia(provider: "google", email: account.email, name: account.displayName, image: account.photoUrl);
      return errorMessage == null;
    } catch (e) {
      debugPrint('Google sign-in error: $e');
      return false;
    }
  }

  Future<String?> signInWithEmail({required String email, required String password}) async {
    final response = await apiClient.postData(
      AppConstants.signInWithEmailUri,
      {'email': email, 'password': password},
      handleError: false,
    );
    if (response.statusCode == 200 && response.body is Map<String, dynamic>) {
      final authResponse = AuthResponse.fromJson(response.body as Map<String, dynamic>);
      if (authResponse.token != null) {
        _saveAuthData(authResponse);
        return null;
      }
    }
    return _extractError(response, 'invalid_credentials'.tr);
  }

  Future<String?> _signInWithSocialMedia({required String provider, required String email,  String? name, String? image}) async {
    final response = await apiClient.postData(
      AppConstants.signInWithSocialMediaUri,
      {'provider': provider, 'email': email, 'name': name, 'image': image},
      handleError: false,
    );
    if (response.statusCode == 200 && response.body is Map<String, dynamic>) {
      final authResponse = AuthResponse.fromJson(response.body as Map<String, dynamic>);
      if (authResponse.token != null) {
        _saveAuthData(authResponse);
        return null;
      }
    }
    return _extractError(response, 'invalid_credentials'.tr);
  }

  Future<String?> createAccountWithEmail(CreateAccountModel account) async {
    final response = await apiClient.postData(
      AppConstants.signUpWithEmailUri,
      {'name': account.name, 'email': account.email, 'password': account.password},
      handleError: false,
    );
    if ((response.statusCode == 200 || response.statusCode == 201) && response.body is Map<String, dynamic>) {
      final authResponse = AuthResponse.fromJson(response.body as Map<String, dynamic>);
      if (authResponse.token != null) {
        _saveAuthData(authResponse);
        return null;
      }
    }
    return _extractError(response, 'create_account_failed'.tr);
  }

  Future<Response> updateProfile({required String name, String? password, XFile? avatar}) async {
    final body = <String, String>{'name': name};
    if (password != null && password.isNotEmpty) body['password'] = password;

    return apiClient.postMultipartData(
      AppConstants.updateProfileUri,
      body,
      avatar != null ? [MultipartBody('avatar', avatar)] : [],
      [],
      handleError: false,
    );
  }

  Future<UserModel?> fetchProfile() async {
    final response = await apiClient.getData(AppConstants.profileUri, handleError: false);
    if (response.statusCode == 200 && response.body['user'] is Map<String, dynamic>) {
      return UserModel.fromJson(response.body['user'] as Map<String, dynamic>);
    }
    return null;
  }

  String? get selectedAiModelId => getString(AppConstants.selectedAiModelId);
  void saveSelectedAiModelId(String id) => saveString(AppConstants.selectedAiModelId, id);

  bool get isRememberMe => getBool(AppConstants.rememberMe);
  String? get rememberedEmail => getString(AppConstants.savedEmail);
  String? get rememberedPassword => getString(AppConstants.savedPassword);

  void saveCredentials(String email, String password) {
    saveString(AppConstants.savedEmail, email);
    saveString(AppConstants.savedPassword, password);
    saveBool(AppConstants.rememberMe, true);
  }

  void clearCredentials() {
    remove(AppConstants.savedEmail);
    remove(AppConstants.savedPassword);
    saveBool(AppConstants.rememberMe, false);
  }

  Future<void> signOut() async {
    await unsubscribeToken();
    await _googleSignIn.signOut();
    remove(AppConstants.token);
    apiClient.updateHeader(null, getString(AppConstants.languageCode));
  }

  Future<Response?> updateToken() async {
    String? deviceToken;
    if (GetPlatform.isIOS) {
      FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(alert: true, badge: true, sound: true);
      NotificationSettings settings = await FirebaseMessaging.instance.requestPermission(
        alert: true, announcement: false, badge: true, carPlay: false,
        criticalAlert: false, provisional: false, sound: true,
      );
      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        deviceToken = await _saveDeviceToken();
      }
    } else {
      deviceToken = await _saveDeviceToken();
    }

    if (deviceToken == null) return null;
    return await apiClient.postData(
      AppConstants.tokenUrl,
      {'_method': 'put', 'fcm_token': deviceToken},
      handleError: false,
    );
  }

  Future<String?> _saveDeviceToken() async {
    String? deviceToken = '@';
    if (!GetPlatform.isWeb) {
      try {
        deviceToken = await FirebaseMessaging.instance.getToken();
      } catch (e) {
        if (kDebugMode) {
          print('token error : $e');
        }
      }
    }
    if (kDebugMode && deviceToken != null) {
      print('--------Device Token---------- $deviceToken');
    }
    return deviceToken;
  }

  Future<void> unsubscribeToken() async {
    if (!isLoggedIn) return;
    try {
      await apiClient.postData(
        AppConstants.tokenUrl,
        {'_method': 'put', 'fcm_token': '@'},
        handleError: false,
      );
    } catch (e) {
      if (kDebugMode) print('unsubscribe token error: $e');
    }
  }

  Future<Response> changePassword({required String currentPassword, required String newPassword}) async {
    return await apiClient.postData(AppConstants.changePasswordUri, {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<Response> changeEmail({required String newEmail, required String password}) async {
    return await apiClient.postData(AppConstants.changeEmailUri, {
      'newEmail': newEmail,
      'password': password,
    });
  }

  Future<Response> deleteAccount() async {
    return await apiClient.deleteData(AppConstants.deleteAccountUri);
  }

  void saveString(String key, String value) => sharedPreferences.setString(key, value);
  String? getString(String key) => sharedPreferences.getString(key);
  void saveBool(String key, bool value) => sharedPreferences.setBool(key, value);
  bool getBool(String key, {bool defaultValue = false}) => sharedPreferences.getBool(key) ?? defaultValue;
  void saveInt(String key, int value) => sharedPreferences.setInt(key, value);
  int getInt(String key, {int defaultValue = 0}) => sharedPreferences.getInt(key) ?? defaultValue;
  void remove(String key) => sharedPreferences.remove(key);
}

