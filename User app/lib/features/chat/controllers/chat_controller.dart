import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import 'package:lumen/common/controller/ai_response_model.dart';
import 'package:lumen/common/widgets/custom_snackbar_widget.dart';
import 'package:lumen/features/chat/models/chat_models.dart';
import 'package:lumen/features/chat/repo/chat_repo.dart';
import 'package:lumen/features/dashboard/controllers/dashboard_controller.dart';
import 'package:lumen/features/profile/controllers/profile_controller.dart';
import 'package:lumen/common/controller/localization_controller.dart';

class ChatController extends GetxController implements GetxService {
  final ChatRepo _chatRepo;

  ChatController({required ChatRepo chatRepo}) : _chatRepo = chatRepo;

  final ScrollController scrollController = ScrollController();

  bool isLoadingConversations = false;
  bool isLoadingMessages = false;
  bool isStreaming = false;
  bool isUploadingAttachment = false;

  void scrollToBottom({bool animated = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (scrollController.hasClients) {
        if (animated) {
          scrollController.animateTo(
            scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
          );
        } else {
          scrollController.jumpTo(scrollController.position.maxScrollExtent);
        }
      }
    });
  }

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
    scrollToBottom(animated: false);
  }

  String get selectedModelLabel {
    try {
      if (Get.isRegistered<DashboardController>()) {
        final models = Get.find<DashboardController>().aiModelList;
        final match = models.firstWhereOrNull(
          (m) => (m.type == 'CHAT' || m.type == null) &&
                 (m.modelId == selectedModel || m.id == selectedModel),
        );
        if (match?.label != null && match!.label!.trim().isNotEmpty) {
          return match.label!.trim();
        }
        final defaultModel = models.firstWhereOrNull(
          (m) => (m.type == 'CHAT' || m.type == null) && (m.isDefault == true),
        );
        if (defaultModel?.label != null && defaultModel!.label!.trim().isNotEmpty) {
          return defaultModel.label!.trim();
        }
      }
    } catch (_) {}
    return selectedModel == 'gpt-4o-mini' ? 'Yumpass AI Fast' : selectedModel;
  }

  void syncModelsFromDashboard(List<AiModel> models) {
    final chatModels = models.where((m) => m.type == 'CHAT' || m.type == null).toList();
    if (chatModels.isEmpty) return;

    final hasCurrent = chatModels.any((m) => m.modelId == selectedModel || m.id == selectedModel);
    if (!hasCurrent || selectedModel == 'gpt-4o-mini') {
      final defaultModel = chatModels.firstWhereOrNull((m) => m.isDefault == true) ?? chatModels.first;
      selectedModel = defaultModel.modelId ?? defaultModel.id ?? 'gpt-4o-mini';
    }
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
    scrollToBottom();

    final String currentLang = Get.isRegistered<LocalizationController>()
        ? Get.find<LocalizationController>().locale.languageCode
        : 'as';

    final stream = _chatRepo.sendChatMessageStream(
      message: cleanText,
      conversationId: activeConversationId,
      model: selectedModel,
      language: currentLang,
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
      assistantMessage.isSearching = false;
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
        scrollToBottom();
      } else if (type == 'tool_start') {
        assistantMessage.isSearching = true;
        final input = data['input'] as Map<String, dynamic>?;
        assistantMessage.searchQuery = input?['query']?.toString();
        update();
      } else if (type == 'tool_end') {
        assistantMessage.isSearching = false;
        update();
      } else if (type == 'sources') {
        final citations = data['citations'] as List? ?? [];
        assistantMessage.citations.addAll(citations.map((c) => ChatCitation.fromJson(c)));
        update();
      } else if (type == 'done') {
        assistantMessage.id = data['messageId'] ?? assistantMessage.id;
        assistantMessage.isStreaming = false;
        assistantMessage.isSearching = false;
        isStreaming = false;
        update();
        if (activeConversationId != null && messages.where((m) => m.role == 'assistant').length == 1) {
          _generateTitleForActiveConversation();
        }
      } else if (type == 'error') {
        assistantMessage.content += '\n\n*${data['error'] ?? 'generation_error'.tr}*';
        assistantMessage.isStreaming = false;
        assistantMessage.isSearching = false;
        isStreaming = false;
        showCustomSnackBar(data['error'] ?? 'generation_error'.tr);
        update();
      }
    } catch (_) {}
  }

  Future<void> _generateTitleForActiveConversation() async {
    if (activeConversationId == null) return;
    try {
      final res = await _chatRepo.generateTitle(activeConversationId!);
      if (res.statusCode == 200 && res.body != null && res.body['title'] != null) {
        final newTitle = res.body['title'].toString();
        final idx = conversations.indexWhere((c) => c.id == activeConversationId);
        if (idx != -1) {
          conversations[idx] = conversations[idx].copyWith(title: newTitle);
          update();
        }
      }
    } catch (_) {}
  }

  Future<void> regenerateMessage(String messageId) async {
    if (isStreaming) return;
    final msgIndex = messages.indexWhere((m) => m.id == messageId && m.role == 'assistant');
    if (msgIndex == -1) return;

    // Find previous user message
    ChatMessageModel? lastUserMsg;
    for (int i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role == 'user') {
        lastUserMsg = messages[i];
        break;
      }
    }
    if (lastUserMsg == null) return;

    final targetAssistantMsg = messages[msgIndex];
    targetAssistantMsg.content = '';
    targetAssistantMsg.citations.clear();
    targetAssistantMsg.isStreaming = true;
    targetAssistantMsg.isSearching = false;
    isStreaming = true;
    update();

    final String currentLang = Get.isRegistered<LocalizationController>()
        ? Get.find<LocalizationController>().locale.languageCode
        : 'as';

    final stream = _chatRepo.sendChatMessageStream(
      message: lastUserMsg.content,
      conversationId: activeConversationId,
      model: selectedModel,
      language: currentLang,
      attachmentIds: lastUserMsg.attachments.map((a) => a.id).toList(),
      regenerateMessageId: messageId,
    );

    _streamSub = stream.listen(
      (chunk) {
        _handleStreamChunk(chunk, targetAssistantMsg);
      },
      onError: (err) {
        targetAssistantMsg.content += '\n\n*${'streaming_error'.tr}*';
        targetAssistantMsg.isStreaming = false;
        isStreaming = false;
        update();
      },
      onDone: () {
        targetAssistantMsg.isStreaming = false;
        isStreaming = false;
        update();
        Get.find<ProfileController>().fetchProfile();
      },
    );
  }

  void stopStreaming() {
    _streamSub?.cancel();
    if (messages.isNotEmpty && messages.last.isStreaming) {
      messages.last.isStreaming = false;
      messages.last.isSearching = false;
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

  Future<void> sendFeedback(String messageId, String rating, {String? feedback}) async {
    final response = await _chatRepo.sendFeedback(messageId: messageId, rating: rating, feedback: feedback);
    if (response.statusCode == 200) {
      showCustomSnackBar('thank_you_for_feedback'.tr, isError: false);
    }
  }

  @override
  void onClose() {
    _streamSub?.cancel();
    scrollController.dispose();
    super.onClose();
  }
}
