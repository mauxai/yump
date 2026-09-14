import 'package:lumen/util/app_constants.dart';

class CloudEditModel {
  final String id;
  final String prompt;
  final String image;
  final int creditCost;
  final DateTime createdAt;
  final String projectName;

  CloudEditModel({
    required this.id,
    required this.prompt,
    required this.image,
    required this.creditCost,
    required this.createdAt,
    required this.projectName,
  });

  factory CloudEditModel.fromJson(Map<String, dynamic> json) {
    String img = json['image'] ?? '';
    if (img.isNotEmpty && !img.startsWith('http') && !img.startsWith('data:')) {
      img = '${AppConstants.baseUrl}${img.startsWith('/') ? '' : '/'}$img';
    }
    return CloudEditModel(
      id: json['id'] ?? '',
      prompt: json['prompt'] ?? '',
      image: img,
      creditCost: json['creditCost'] ?? 1,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      projectName: json['project']?['name'] ?? 'Untitled Project',
    );
  }
}
