import 'dart:typed_data';

class ProjectsPaginatedResponse {
  List<Projects>? projects;
  int? total;
  int? page;
  int? pageSize;
  int? totalPages;

  ProjectsPaginatedResponse({this.projects, this.total, this.page, this.pageSize, this.totalPages});

  ProjectsPaginatedResponse.fromJson(Map<String, dynamic> json) {
    if (json['projects'] != null) {
      projects = <Projects>[];
      json['projects'].forEach((v) {
        projects!.add(Projects.fromJson(v));
      });
    }
    total = int.tryParse(json['total'].toString());
    page = int.tryParse(json['page'].toString());
    pageSize = int.tryParse(json['pageSize'].toString());
    totalPages = int.tryParse(json['totalPages'].toString());
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    if (projects != null) {
      data['projects'] = projects!.map((v) => v.toJson()).toList();
    }
    data['total'] = total;
    data['page'] = page;
    data['pageSize'] = pageSize;
    data['totalPages'] = totalPages;
    return data;
  }
}

class Projects {
  String? id;
  String? name;
  int? editCount;
  String? imageUrl;
  String? thumbnailUrl;
  String? originalImage;
  String? createdAt;
  String? updatedAt;
  List<Edits>? edits;

  Projects({
    this.id,
    this.name,
    this.editCount,
    this.thumbnailUrl,
    this.createdAt,
    this.updatedAt,
    this.edits,
    this.originalImage
  });

  Projects.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    name = json['name'];
    editCount = json['edit_count'];
    thumbnailUrl = json['thumbnailUrl'];
    originalImage = json['originalImage'];
    createdAt = json['createdAt'];
    updatedAt = json['updatedAt'];
    if (json['edits'] != null) {
      edits = <Edits>[];
      json['edits'].forEach((v) {
        edits!.add(Edits.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['name'] = name;
    data['edit_count'] = editCount;
    data['thumbnailUrl'] = thumbnailUrl;
    data['originalImage'] = originalImage;
    data['createdAt'] = createdAt;
    data['updatedAt'] = updatedAt;
    if (edits != null) {
      data['edits'] = edits!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Edits {
  String? id;
  String? projectId;
  String? parentId;
  String? prompt;
  String? image;
  String? createdAt;
  Uint8List? imageBytes;

  Edits({
    this.id,
    this.projectId,
    this.parentId,
    this.prompt,
    this.image,
    this.createdAt,
    this.imageBytes,
  });

  Edits.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    projectId = json['projectId'];
    parentId = json['parentId'];
    prompt = json['prompt'];
    image = json['image'];
    createdAt = json['createdAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['projectId'] = projectId;
    data['parentId'] = parentId;
    data['prompt'] = prompt;
    data['image'] = image;
    data['createdAt'] = createdAt;
    return data;
  }
}
