class AiEffectModel {
  List<Categories>? categories;

  AiEffectModel({this.categories});

  AiEffectModel.fromJson(Map<String, dynamic> json) {
    if (json['categories'] != null) {
      categories = <Categories>[];
      json['categories'].forEach((v) {
        categories!.add(Categories.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    if (categories != null) {
      data['categories'] = categories!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Categories {
  String? title;
  String? color;
  List<Effects>? effects;

  Categories({this.title, this.color, this.effects});

  Categories.fromJson(Map<String, dynamic> json) {
    title = json['title'];
    color = json['color'];
    if (json['effects'] != null) {
      effects = <Effects>[];
      json['effects'].forEach((v) {
        effects!.add(Effects.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['title'] = title;
    data['color'] = color;
    if (effects != null) {
      data['effects'] = effects!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Effects {
  String? id;
  String? label;
  String? icon;
  String? prompt;
  String? category;
  String? categoryColor;

  Effects(
      {this.id,
        this.label,
        this.icon,
        this.prompt,
        this.category,
        this.categoryColor});

  Effects.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    label = json['label'];
    icon = json['icon'];
    prompt = json['prompt'];
    category = json['category'];
    categoryColor = json['categoryColor'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['label'] = label;
    data['icon'] = icon;
    data['prompt'] = prompt;
    data['category'] = category;
    data['categoryColor'] = categoryColor;
    return data;
  }
}
