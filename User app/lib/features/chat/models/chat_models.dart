import 'dart:convert';

class ConversationModel {
  final String id;
  final String title;
  final bool pinned;
  final bool archived;
  final String model;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int messageCount;

  ConversationModel({
    required this.id,
    required this.title,
    required this.pinned,
    required this.archived,
    required this.model,
    required this.createdAt,
    required this.updatedAt,
    required this.messageCount,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['id'] ?? '',
      title: json['title'] ?? 'New Chat',
      pinned: json['pinned'] ?? false,
      archived: json['archived'] ?? false,
      model: json['model'] ?? 'gpt-4o-mini',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : DateTime.now(),
      messageCount: json['_count']?['messages'] ?? json['messageCount'] ?? 0,
    );
  }

  ConversationModel copyWith({
    String? title,
    bool? pinned,
    bool? archived,
    String? model,
  }) {
    return ConversationModel(
      id: id,
      title: title ?? this.title,
      pinned: pinned ?? this.pinned,
      archived: archived ?? this.archived,
      model: model ?? this.model,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
      messageCount: messageCount,
    );
  }
}

class ChatMessageModel {
  String id;
  final String role; // 'user' | 'assistant'
  String content;
  final int tokensUsed;
  final DateTime createdAt;
  final List<ChatCitation> citations;
  final List<ChatAttachment> attachments;
  bool isStreaming;

  ChatMessageModel({
    required this.id,
    required this.role,
    required this.content,
    this.tokensUsed = 0,
    DateTime? createdAt,
    List<ChatCitation>? citations,
    List<ChatAttachment>? attachments,
    this.isStreaming = false,
  })  : createdAt = createdAt ?? DateTime.now(),
        citations = citations ?? [],
        attachments = attachments ?? [];

  bool get isUser => role == 'user';

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    List<ChatCitation> parsedCitations = [];
    if (json['sources'] != null) {
      final s = json['sources'];
      if (s is List) {
        parsedCitations = s.map((e) => ChatCitation.fromJson(e)).toList();
      } else if (s is String) {
        try {
          final decoded = jsonDecode(s);
          if (decoded is List) {
            parsedCitations = decoded.map((e) => ChatCitation.fromJson(e)).toList();
          }
        } catch (_) {}
      }
    }

    List<ChatAttachment> parsedAttachments = [];
    if (json['attachments'] != null && json['attachments'] is List) {
      parsedAttachments = (json['attachments'] as List).map((e) => ChatAttachment.fromJson(e)).toList();
    }

    return ChatMessageModel(
      id: json['id'] ?? '',
      role: json['role'] ?? 'user',
      content: json['content'] ?? '',
      tokensUsed: json['tokensUsed'] ?? 0,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      citations: parsedCitations,
      attachments: parsedAttachments,
      isStreaming: false,
    );
  }
}

class ChatCitation {
  final String title;
  final String url;

  ChatCitation({required this.title, required this.url});

  factory ChatCitation.fromJson(Map<String, dynamic> json) {
    return ChatCitation(
      title: json['title'] ?? '',
      url: json['url'] ?? '',
    );
  }
}

class ChatAttachment {
  final String id;
  final String fileName;
  final String fileType;
  final int fileSize;
  final String storagePath;

  ChatAttachment({
    required this.id,
    required this.fileName,
    required this.fileType,
    required this.fileSize,
    required this.storagePath,
  });

  factory ChatAttachment.fromJson(Map<String, dynamic> json) {
    return ChatAttachment(
      id: json['id'] ?? '',
      fileName: json['fileName'] ?? json['file_name'] ?? '',
      fileType: json['fileType'] ?? json['file_type'] ?? '',
      fileSize: json['fileSize'] ?? json['file_size'] ?? 0,
      storagePath: json['storagePath'] ?? json['storage_path'] ?? '',
    );
  }
}
