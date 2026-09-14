import 'dart:io';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lumen/api/api_client.dart';
import 'package:lumen/features/auth/repo/auth_repo.dart';
import 'package:lumen/util/app_constants.dart';

class ChatRepo {
  final AuthRepo authRepo;
  final ApiClient apiClient;

  ChatRepo({required this.authRepo, required this.apiClient});

  Future<Response> getConversations({String? search, bool? archived}) async {
    String uri = AppConstants.conversationsUri;
    final params = <String>[];
    if (search != null && search.trim().isNotEmpty) {
      params.add('q=${Uri.encodeComponent(search.trim())}');
    }
    if (archived != null) {
      params.add('archived=$archived');
    }
    if (params.isNotEmpty) {
      uri += '?${params.join('&')}';
    }
    return await apiClient.getData(uri);
  }

  Future<Response> getConversationMessages(String conversationId) async {
    return await apiClient.getData('${AppConstants.conversationsUri}/$conversationId');
  }

  Stream<String> sendChatMessageStream({
    required String message,
    String? conversationId,
    String? model,
    String? language,
    List<String>? attachmentIds,
    String? regenerateMessageId,
  }) {
    final body = {
      'message': message,
      if (conversationId != null) 'conversationId': conversationId,
      if (model != null) 'model': model,
      if (language != null) 'language': language,
      if (attachmentIds != null && attachmentIds.isNotEmpty) 'attachmentIds': attachmentIds,
      if (regenerateMessageId != null) 'regenerateMessageId': regenerateMessageId,
    };
    return apiClient.postStream(AppConstants.chatUri, body);
  }

  Future<Response> updateConversation(
    String id, {
    String? title,
    bool? pinned,
    bool? archived,
    String? model,
  }) async {
    final body = <String, dynamic>{};
    if (title != null) body['title'] = title;
    if (pinned != null) body['pinned'] = pinned;
    if (archived != null) body['archived'] = archived;
    if (model != null) body['model'] = model;

    return await apiClient.patchData('${AppConstants.conversationsUri}/$id', body);
  }

  Future<Response> deleteConversation(String id) async {
    return await apiClient.deleteData('${AppConstants.conversationsUri}/$id');
  }

  Future<Response> sendFeedback({
    required String messageId,
    required String rating,
    String? feedback,
  }) async {
    return await apiClient.postData(AppConstants.chatFeedbackUri, {
      'messageId': messageId,
      'rating': rating,
      if (feedback != null) 'feedback': feedback,
    });
  }

  Future<Response> generateTitle(String conversationId) async {
    return await apiClient.postData('${AppConstants.conversationsUri}/$conversationId/title', {});
  }

  Future<Response> uploadAttachment(File file, {String? conversationId}) async {
    final body = <String, String>{};
    if (conversationId != null) body['conversationId'] = conversationId;

    return await apiClient.postMultipartData(
      AppConstants.chatAttachmentUploadUri,
      body,
      [MultipartBody('file', XFile(file.path))],
      [],
    );
  }
}
