class ProjectModel {
  final String id;
  final String imagePath;
  final String name;
  final DateTime createdAt;

  ProjectModel({
    required this.id,
    required this.imagePath,
    required this.name,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'imagePath': imagePath,
        'name': name,
        'createdAt': createdAt.toIso8601String(),
      };

  factory ProjectModel.fromJson(Map<String, dynamic> json) => ProjectModel(
        id: json['id'] as String,
        imagePath: json['imagePath'] as String,
        name: json['name'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
