import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:get/get.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/chat/models/chat_models.dart';
import 'package:lumen/features/chat/repo/chat_repo.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';

class ChatController extends GetxController implements GetxService {
  final ChatRepo _chatRepo;

  ChatController({required ChatRepo chatRepo}) : _chatRepo = chatRepo;

  bool isLoadingConversations = false;
  bool isLoadingMessages = false;
  bool isStreaming = false;
  bool isUploadingAttachment = false;

  List<ConversationModel> conversations = [];
  List<ChatMessageModel> messages = [];
  String? activeConversationId;
  String selectedModel = 'gpt-4o-mini';

  StreamSubscription<String>? _streamSub;
  final List<ChatAttachment> pendingAttachments = [];

  // Grouped conversations
  List<ConversationModel> get pinnedConversations => conversations.where((c) => c.pinned && !c.archived).toList();
  List<ConversationModel> get todayConversations {
    final now = DateTime.now();
    return conversations.where((c) {
      if (c.pinned || c.archived) return false;
      return c.updatedAt.year == now.year && c.updatedAt.month == now.month && c.updatedAt.day == now.day;
    }).toList();
  }

  List<ConversationModel> get yesterdayConversations {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return conversations.where((c) {
      if (c.pinned || c.archived) return false;
      return c.updatedAt.year == yesterday.year && c.updatedAt.month == yesterday.month && c.updatedAt.day == yesterday.day;
    }).toList();
  }

  List<ConversationModel> get olderConversations {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return conversations.where((c) {
      if (c.pinned || c.archived) return false;
      return c.updatedAt.isBefore(DateTime(yesterday.year, yesterday.month, yesterday.day));
    }).toList();
  }

  Future<void> loadConversations({String? search}) async {
    isLoadingConversations = true;
    update();

    final response = await _chatRepo.getConversations(search: search);
    if (response.statusCode == 200 && response.body != null) {
      final list = response.body['conversations'] as List? ?? [];
      conversations = list.map((e) => ConversationModel.fromJson(e)).toList();
    } else {
      showCustomSnackBar('failed_to_load_conversations'.tr);
    }

    isLoadingConversations = false;
    update();
  }

  void startNewChat() {
    activeConversationId = null;
    messages = [];
    pendingAttachments.clear();
    update();
  }

  Future<void> selectConversation(String id) async {
    if (activeConversationId == id && messages.isNotEmpty) return;

    activeConversationId = id;
    isLoadingMessages = true;
    messages = [];
    pendingAttachments.clear();
    update();

    final response = await _chatRepo.getConversationMessages(id);
    if (response.statusCode == 200 && response.body != null) {
      final conv = response.body['conversation'];
      if (conv != null) {
        selectedModel = conv['model'] ?? selectedModel;
        final rawMsgs = conv['messages'] as List? ?? [];
        messages = rawMsgs.map((m) => ChatMessageModel.fromJson(m)).toList();
      }
    } else {
      showCustomSnackBar('failed_to_load_messages'.tr);
    }

    isLoadingMessages = false;
    update();
  }

  void setModel(String model) {
    selectedModel = model;
    update();
  }

  Future<void> addAttachment(File file) async {
    isUploadingAttachment = true;
    update();

    final response = await _chatRepo.uploadAttachment(file, conversationId: activeConversationId);
    if (response.statusCode == 200 && response.body != null && response.body['attachment'] != null) {
      final att = ChatAttachment.fromJson(response.body['attachment']);
      pendingAttachments.add(att);
    } else {
      showCustomSnackBar('attachment_upload_failed'.tr);
    }

    isUploadingAttachment = false;
    update();
  }

  void removePendingAttachment(int index) {
    if (index >= 0 && index < pendingAttachments.length) {
      pendingAttachments.removeAt(index);
      update();
    }
  }

  Future<void> sendMessage(String text) async {
    final cleanText = text.trim();
    if (cleanText.isEmpty && pendingAttachments.isEmpty) return;
    if (isStreaming) return;

    final userMessage = ChatMessageModel(
      id: 'local_${DateTime.now().millisecondsSinceEpoch}',
      role: 'user',
      content: cleanText,
      attachments: List.from(pendingAttachments),
    );
    messages.add(userMessage);

    final attachmentIds = pendingAttachments.map((a) => a.id).toList();
    pendingAttachments.clear();

    final assistantMessage = ChatMessageModel(
      id: 'assistant_temp',
      role: 'assistant',
      content: '',
      isStreaming: true,
    );
    messages.add(assistantMessage);

    isStreaming = true;
    update();

    final stream = _chatRepo.sendChatMessageStream(
      message: cleanText,
      conversationId: activeConversationId,
      model: selectedModel,
      attachmentIds: attachmentIds,
    );

    _streamSub = stream.listen(
      (chunk) {
        _handleStreamChunk(chunk, assistantMessage);
      },
      onError: (err) {
        assistantMessage.content += '\n\n*${'streaming_error'.tr}*';
        assistantMessage.isStreaming = false;
        isStreaming = false;
        update();
      },
      onDone: () {
        assistantMessage.isStreaming = false;
        isStreaming = false;
        update();
        Get.find<ProfileController>().fetchProfile();
      },
    );
  }

  void _handleStreamChunk(String chunk, ChatMessageModel assistantMessage) {
    // SSE lines formatted as: "data: { ... }"
    final trimmed = chunk.trim();
    if (!trimmed.startsWith('data:')) return;

    final jsonStr = trimmed.substring(5).trim();
    if (jsonStr == '[DONE]') {
      assistantMessage.isStreaming = false;
      isStreaming = false;
      update();
      return;
    }

    try {
      final data = jsonDecode(jsonStr);
      final type = data['type'];

      if (type == 'meta') {
        if (activeConversationId == null && data['conversationId'] != null) {
          activeConversationId = data['conversationId'];
          loadConversations();
        }
      } else if (type == 'token') {
        assistantMessage.content += (data['text'] ?? '');
        update();
      } else if (type == 'sources') {
        final citations = data['citations'] as List? ?? [];
        assistantMessage.citations.addAll(citations.map((c) => ChatCitation.fromJson(c)));
        update();
      } else if (type == 'done') {
        assistantMessage.id = data['messageId'] ?? assistantMessage.id;
        assistantMessage.isStreaming = false;
        isStreaming = false;
        update();
      } else if (type == 'error') {
        assistantMessage.content += '\n\n*${data['error'] ?? 'generation_error'.tr}*';
        assistantMessage.isStreaming = false;
        isStreaming = false;
        showCustomSnackBar(data['error'] ?? 'generation_error'.tr);
        update();
      }
    } catch (_) {}
  }

  void stopStreaming() {
    _streamSub?.cancel();
    if (messages.isNotEmpty && messages.last.isStreaming) {
      messages.last.isStreaming = false;
    }
    isStreaming = false;
    update();
  }

  Future<void> togglePin(String id, bool currentlyPinned) async {
    final response = await _chatRepo.updateConversation(id, pinned: !currentlyPinned);
    if (response.statusCode == 200) {
      loadConversations();
    } else {
      showCustomSnackBar('failed_to_update_conversation'.tr);
    }
  }

  Future<void> renameConversation(String id, String newTitle) async {
    final response = await _chatRepo.updateConversation(id, title: newTitle.trim());
    if (response.statusCode == 200) {
      loadConversations();
      showCustomSnackBar('conversation_renamed'.tr, isError: false);
    } else {
      showCustomSnackBar('failed_to_rename_conversation'.tr);
    }
  }

  Future<void> deleteConversation(String id) async {
    final response = await _chatRepo.deleteConversation(id);
    if (response.statusCode == 200) {
      if (activeConversationId == id) {
        startNewChat();
      }
      loadConversations();
      showCustomSnackBar('conversation_deleted'.tr, isError: false);
    } else {
      showCustomSnackBar('failed_to_delete_conversation'.tr);
    }
  }

  Future<void> sendFeedback(String messageId, int rating, {String? feedback}) async {
    final response = await _chatRepo.sendFeedback(messageId: messageId, rating: rating, feedback: feedback);
    if (response.statusCode == 200) {
      showCustomSnackBar('thank_you_for_feedback'.tr, isError: false);
    }
  }

  @override
  void onClose() {
    _streamSub?.cancel();
    super.onClose();
  }
}
