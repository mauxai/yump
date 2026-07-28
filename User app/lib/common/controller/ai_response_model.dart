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
  double? creditCost;

  AiModel(
      {this.id, this.label, this.provider, this.modelId, this.creditCost});

  AiModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    label = json['label'];
    provider = json['provider'];
    modelId = json['modelId'];
    creditCost = double.tryParse(json['creditCost'].toString());
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['label'] = label;
    data['provider'] = provider;
    data['modelId'] = modelId;
    data['creditCost'] = creditCost;
    return data;
  }
}
