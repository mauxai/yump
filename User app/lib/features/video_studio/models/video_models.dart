import 'package:lumen/util/app_constants.dart';

class VideoModelDefinition {
  final String key;
  final String id;
  final String name;
  final int creditCost;
  final bool supportsI2V;
  final List<int> durations;
  final List<String> aspectRatios;
  final String defaultAspectRatio;
  final String description;

  VideoModelDefinition({
    required this.key,
    required this.id,
    required this.name,
    required this.creditCost,
    required this.supportsI2V,
    required this.durations,
    required this.aspectRatios,
    required this.defaultAspectRatio,
    required this.description,
  });

  factory VideoModelDefinition.fromJson(Map<String, dynamic> json) {
    return VideoModelDefinition(
      key: json['key'] ?? '',
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      creditCost: json['creditCost'] ?? 5,
      supportsI2V: json['supportsI2V'] ?? false,
      durations: (json['durations'] as List? ?? [5]).map((e) => (e as num).toInt()).toList(),
      aspectRatios: (json['aspectRatios'] as List? ?? ['16:9']).map((e) => e.toString()).toList(),
      defaultAspectRatio: json['defaultAspectRatio'] ?? '16:9',
      description: json['description'] ?? '',
    );
  }

  static List<VideoModelDefinition> get defaultModels => [
        VideoModelDefinition(
          key: 'kling-v1-5',
          id: 'fal-ai/kling-video/v1.5/standard',
          name: 'Kling 1.5 Standard',
          creditCost: 5,
          supportsI2V: true,
          durations: [5],
          aspectRatios: ['16:9', '9:16', '1:1'],
          defaultAspectRatio: '16:9',
          description: 'High cinematic quality with smooth motion and photorealistic consistency.',
        ),
        VideoModelDefinition(
          key: 'luma-dream-machine',
          id: 'fal-ai/luma-dream-machine',
          name: 'Luma Dream Machine',
          creditCost: 6,
          supportsI2V: true,
          durations: [5],
          aspectRatios: ['16:9', '9:16'],
          defaultAspectRatio: '16:9',
          description: 'Exceptional dynamic camera pans and realistic physics.',
        ),
        VideoModelDefinition(
          key: 'minimax-hailuo',
          id: 'fal-ai/minimax-video',
          name: 'Minimax Hailuo Video',
          creditCost: 5,
          supportsI2V: true,
          durations: [6],
          aspectRatios: ['16:9', '9:16', '1:1'],
          defaultAspectRatio: '16:9',
          description: 'High motion fidelity, vibrant colors, and natural character movement.',
        ),
        VideoModelDefinition(
          key: 'wan-v2-1',
          id: 'fal-ai/wan-2.1/text-to-video',
          name: 'Wan 2.1 Video',
          creditCost: 4,
          supportsI2V: false,
          durations: [5],
          aspectRatios: ['16:9', '9:16'],
          defaultAspectRatio: '16:9',
          description: 'Fast generation with clean composition and strong text prompt adherence.',
        ),
      ];
}

class VideoRecord {
  final String id;
  final String prompt;
  final String? negativePrompt;
  final String? sourceImageUrl;
  final String aspectRatio;
  final String modelId;
  final int duration;
  String status; // 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  String? videoUrl;
  String? thumbnailUrl;
  final int creditCost;
  final String? errorMessage;
  final DateTime createdAt;

  VideoRecord({
    required this.id,
    required this.prompt,
    this.negativePrompt,
    this.sourceImageUrl,
    required this.aspectRatio,
    required this.modelId,
    required this.duration,
    required this.status,
    this.videoUrl,
    this.thumbnailUrl,
    required this.creditCost,
    this.errorMessage,
    required this.createdAt,
  });

  bool get isCompleted => status == 'COMPLETED';
  bool get isProcessing => status == 'PENDING' || status == 'PROCESSING';
  bool get isFailed => status == 'FAILED';

  factory VideoRecord.fromJson(Map<String, dynamic> json) {
    String? vUrl = json['videoUrl'];
    if (vUrl != null && vUrl.isNotEmpty && !vUrl.startsWith('http') && !vUrl.startsWith('data:')) {
      vUrl = '${AppConstants.baseUrl}${vUrl.startsWith('/') ? '' : '/'}$vUrl';
    }
    String? tUrl = json['thumbnailUrl'];
    if (tUrl != null && tUrl.isNotEmpty && !tUrl.startsWith('http') && !tUrl.startsWith('data:')) {
      tUrl = '${AppConstants.baseUrl}${tUrl.startsWith('/') ? '' : '/'}$tUrl';
    }
    return VideoRecord(
      id: json['id'] ?? '',
      prompt: json['prompt'] ?? '',
      negativePrompt: json['negativePrompt'],
      sourceImageUrl: json['sourceImageUrl'],
      aspectRatio: json['aspectRatio'] ?? '16:9',
      modelId: json['modelId'] ?? '',
      duration: json['duration'] ?? 5,
      status: json['status'] ?? 'PENDING',
      videoUrl: vUrl,
      thumbnailUrl: tUrl,
      creditCost: json['creditCost'] ?? 5,
      errorMessage: json['errorMessage'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}
