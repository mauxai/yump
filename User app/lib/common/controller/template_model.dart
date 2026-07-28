class TemplateResponseModel {
  List<Templates>? templates;

  TemplateResponseModel({this.templates});

  TemplateResponseModel.fromJson(Map<String, dynamic> json) {
    if (json['templates'] != null) {
      templates = <Templates>[];
      json['templates'].forEach((v) {
        templates!.add(Templates.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    if (templates != null) {
      data['templates'] = templates!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Templates {
  String? id;
  String? title;
  String? description;
  String? imageUrl;
  String? prompt;
  int? sortOrder;
  int? usageCount;
  String? categoryId;
  String? categoryName;

  Templates({
    this.id,
    this.title,
    this.description,
    this.imageUrl,
    this.prompt,
    this.sortOrder,
    this.usageCount,
    this.categoryId,
    this.categoryName,
  });

  Templates.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    title = json['title'];
    description = json['description'];
    imageUrl = json['imageUrl'];
    prompt = json['prompt'];
    sortOrder = json['sortOrder'];
    usageCount = json['usageCount'];
    categoryId = json['categoryId'];
    categoryName = json['categoryName'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['title'] = title;
    data['description'] = description;
    data['imageUrl'] = imageUrl;
    data['prompt'] = prompt;
    data['sortOrder'] = sortOrder;
    data['usageCount'] = usageCount;
    data['categoryId'] = categoryId;
    data['categoryName'] = categoryName;
    return data;
  }
}
