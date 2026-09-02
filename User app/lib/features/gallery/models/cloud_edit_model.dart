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
    return CloudEditModel(
      id: json['id'] ?? '',
      prompt: json['prompt'] ?? '',
      image: json['image'] ?? '',
      creditCost: json['creditCost'] ?? 1,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      projectName: json['project']?['name'] ?? 'Untitled Project',
    );
  }
}
