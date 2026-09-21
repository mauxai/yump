import 'package:lumen/util/app_constants.dart';

class TimelineClipModel {
  String id;
  String videoUrl;
  int length;
  int trim;
  String? transitionIn;
  String? transitionOut;
  String? filter;
  String? effect;
  String? fit;
  double? volume;

  TimelineClipModel({
    required this.id,
    required this.videoUrl,
    this.length = 5,
    this.trim = 0,
    this.transitionIn,
    this.transitionOut,
    this.filter,
    this.effect,
    this.fit,
    this.volume,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'videoUrl': videoUrl,
        'length': length,
        'trim': trim,
        if (transitionIn != null) 'transitionIn': transitionIn,
        if (transitionOut != null) 'transitionOut': transitionOut,
        if (filter != null) 'filter': filter,
        if (effect != null) 'effect': effect,
        if (fit != null) 'fit': fit,
        if (volume != null) 'volume': volume,
      };

  factory TimelineClipModel.fromJson(Map<String, dynamic> json) => TimelineClipModel(
        id: json['id'] ?? '',
        videoUrl: json['videoUrl'] ?? '',
        length: json['length'] ?? 5,
        trim: json['trim'] ?? 0,
        transitionIn: json['transitionIn'],
        transitionOut: json['transitionOut'],
        filter: json['filter'],
        effect: json['effect'],
        fit: json['fit'],
        volume: json['volume']?.toDouble(),
      );
}

class TextOverlayModel {
  String id;
  String text;
  String position;
  String style;
  String color;
  int start;
  int length;

  TextOverlayModel({
    required this.id,
    required this.text,
    this.position = 'bottom',
    this.style = 'minimal',
    this.color = '#ffffff',
    this.start = 0,
    this.length = 3,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'position': position,
        'style': style,
        'color': color,
        'start': start,
        'length': length,
      };

  factory TextOverlayModel.fromJson(Map<String, dynamic> json) => TextOverlayModel(
        id: json['id'] ?? '',
        text: json['text'] ?? '',
        position: json['position'] ?? 'bottom',
        style: json['style'] ?? 'minimal',
        color: json['color'] ?? '#ffffff',
        start: json['start'] ?? 0,
        length: json['length'] ?? 3,
      );
}

class VideoEditRecordModel {
  final String id;
  final String title;
  String status; // 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  String? videoUrl;
  String? thumbnailUrl;
  final double? duration;
  final String aspectRatio;
  final String resolution;
  final int creditCost;
  final String? errorMessage;
  final DateTime createdAt;

  VideoEditRecordModel({
    required this.id,
    required this.title,
    required this.status,
    this.videoUrl,
    this.thumbnailUrl,
    this.duration,
    required this.aspectRatio,
    required this.resolution,
    required this.creditCost,
    this.errorMessage,
    required this.createdAt,
  });

  bool get isCompleted => status == 'COMPLETED';
  bool get isProcessing => status == 'PENDING' || status == 'PROCESSING';
  bool get isFailed => status == 'FAILED';

  factory VideoEditRecordModel.fromJson(Map<String, dynamic> json) {
    String? vUrl = json['videoUrl'];
    if (vUrl != null && vUrl.isNotEmpty && !vUrl.startsWith('http') && !vUrl.startsWith('data:')) {
      vUrl = '${AppConstants.baseUrl}${vUrl.startsWith('/') ? '' : '/'}$vUrl';
    }
    String? tUrl = json['thumbnailUrl'];
    if (tUrl != null && tUrl.isNotEmpty && !tUrl.startsWith('http') && !tUrl.startsWith('data:')) {
      tUrl = '${AppConstants.baseUrl}${tUrl.startsWith('/') ? '' : '/'}$tUrl';
    }
    return VideoEditRecordModel(
      id: json['id'] ?? '',
      title: json['title'] ?? 'Untitled Edit',
      status: json['status'] ?? 'PENDING',
      videoUrl: vUrl,
      thumbnailUrl: tUrl,
      duration: json['duration'] != null ? (json['duration'] as num).toDouble() : null,
      aspectRatio: json['aspectRatio'] ?? '16:9',
      resolution: json['resolution'] ?? 'hd',
      creditCost: json['creditCost'] ?? 3,
      errorMessage: json['errorMessage'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}
