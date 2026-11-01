class ImageModelDefinition {
  final String dbId;
  final String id;
  final String name;
  final String provider;
  final int creditCost;
  final bool isDefault;
  final List<String> aspectRatios;
  final String defaultAspectRatio;

  ImageModelDefinition({
    required this.dbId,
    required this.id,
    required this.name,
    required this.provider,
    required this.creditCost,
    required this.isDefault,
    required this.aspectRatios,
    required this.defaultAspectRatio,
  });

  factory ImageModelDefinition.fromJson(Map<String, dynamic> json) {
    return ImageModelDefinition(
      dbId: json['dbId'] ?? '',
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      provider: json['provider'] ?? 'openai',
      creditCost: json['creditCost'] ?? 1,
      isDefault: json['isDefault'] ?? false,
      aspectRatios: (json['aspectRatios'] as List? ?? ['1:1', '16:9', '9:16'])
          .map((e) => e.toString())
          .toList(),
      defaultAspectRatio: json['defaultAspectRatio'] ?? '1:1',
    );
  }

  static List<ImageModelDefinition> get fallbackModels => [
        ImageModelDefinition(
          dbId: 'default',
          id: 'dall-e-3',
          name: 'DALL·E 3',
          provider: 'openai',
          creditCost: 1,
          isDefault: true,
          aspectRatios: ['1:1', '16:9', '9:16'],
          defaultAspectRatio: '1:1',
        ),
      ];
}

class ImageGenerationRecord {
  final String id;
  final String name;
  final String imageUrl;
  final String prompt;
  final String modelLabel;
  final String createdAt;

  ImageGenerationRecord({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.prompt,
    required this.modelLabel,
    required this.createdAt,
  });

  factory ImageGenerationRecord.fromJson(Map<String, dynamic> json) {
    return ImageGenerationRecord(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      prompt: json['prompt'] ?? '',
      modelLabel: json['modelLabel'] ?? 'AI',
      createdAt: json['createdAt'] ?? '',
    );
  }
}
