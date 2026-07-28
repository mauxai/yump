import 'package:lumen/features/projects/model/project_paginated_response_model.dart';

class PaginatedActivityModel {
  Stats? stats;
  List<Edits>? edits;
  List<Projects>? activeProjects;
  Pagination? pagination;

  PaginatedActivityModel(
      {this.stats, this.edits, this.activeProjects, this.pagination});

  PaginatedActivityModel.fromJson(Map<String, dynamic> json) {
    stats = json['stats'] != null ? Stats.fromJson(json['stats']) : null;
    if (json['edits'] != null) {
      edits = <Edits>[];
      json['edits'].forEach((v) {
        edits!.add(Edits.fromJson(v));
      });
    }
    if (json['activeProjects'] != null) {
      activeProjects = <Projects>[];
      json['activeProjects'].forEach((v) {
        activeProjects!.add(Projects.fromJson(v));
      });
    }
    pagination = json['pagination'] != null
        ? Pagination.fromJson(json['pagination'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    if (stats != null) {
      data['stats'] = stats!.toJson();
    }
    if (edits != null) {
      data['edits'] = edits!.map((v) => v.toJson()).toList();
    }
    if (activeProjects != null) {
      data['activeProjects'] =
          activeProjects!.map((v) => v.toJson()).toList();
    }
    if (pagination != null) {
      data['pagination'] = pagination!.toJson();
    }
    return data;
  }
}

class Stats {
  int? totalEdits;
  int? projectsEdited;
  int? pageCount;

  Stats({this.totalEdits, this.projectsEdited, this.pageCount});

  Stats.fromJson(Map<String, dynamic> json) {
    totalEdits = int.tryParse(json['totalEdits'].toString());
    projectsEdited = int.tryParse(json['projectsEdited'].toString());
    pageCount = int.tryParse(json['pageCount'].toString());
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['totalEdits'] = totalEdits;
    data['projectsEdited'] = projectsEdited;
    data['pageCount'] = pageCount;
    return data;
  }
}

class Edits {
  String? id;
  String? prompt;
  String? image;
  String? createdAt;
  Projects? project;

  Edits({this.id, this.prompt, this.image, this.createdAt, this.project});

  Edits.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    prompt = json['prompt'];
    image = json['image'];
    createdAt = json['createdAt'];
    project = json['project'] != null ? Projects.fromJson(json['project']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['prompt'] = prompt;
    data['image'] = image;
    data['createdAt'] = createdAt;
    if (project != null) {
      data['project'] = project!.toJson();
    }
    return data;
  }
}

class Pagination {
  int? total;
  int? page;
  int? pageSize;
  int? totalPages;

  Pagination({this.total, this.page, this.pageSize, this.totalPages});

  Pagination.fromJson(Map<String, dynamic> json) {
    total = int.tryParse(json['total'].toString());
    page = int.tryParse(json['page'].toString());
    pageSize = int.tryParse(json['pageSize'].toString());
    totalPages = int.tryParse(json['totalPages'].toString());
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['total'] = total;
    data['page'] = page;
    data['pageSize'] = pageSize;
    data['totalPages'] = totalPages;
    return data;
  }
}
