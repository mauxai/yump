class AiResponseModel {
  List<AiModel>? aiModelList;

  AiResponseModel({this.aiModelList});

  AiResponseModel.fromJson(Map<String, dynamic> json) {
    if (json['providers'] != null) {
      aiModelList = <AiModel>[];
      json['providers'].forEach((v) {
        aiModelList!.add(AiModel.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    if (aiModelList != null) {
      data['providers'] = aiModelList!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class AiModel {
  String? id;
  String? label;
  String? provider;
  String? modelId;
  String? type;
  bool? isDefault;
  double? creditCost;

  AiModel(
      {this.id, this.label, this.provider, this.modelId, this.type, this.isDefault, this.creditCost});

  AiModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    label = json['label'];
    provider = json['provider'];
    modelId = json['modelId'];
    type = json['type'];
    isDefault = json['isDefault'];
    creditCost = double.tryParse(json['creditCost'].toString());
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['label'] = label;
    data['provider'] = provider;
    data['modelId'] = modelId;
    data['type'] = type;
    data['isDefault'] = isDefault;
    data['creditCost'] = creditCost;
    return data;
  }
}
