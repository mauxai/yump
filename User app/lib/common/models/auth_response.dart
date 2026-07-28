class AuthResponse {
  String? token;
  String? expiresIn;
  String? tokenType;
  UserModel? user;

  AuthResponse({this.token, this.expiresIn, this.tokenType, this.user});

  AuthResponse.fromJson(Map<String, dynamic> json) {
    token = json['token'];
    expiresIn = json['expiresIn'];
    tokenType = json['tokenType'];
    user = json['user'] != null ? UserModel.fromJson(json['user']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['token'] = token;
    data['expiresIn'] = expiresIn;
    data['tokenType'] = tokenType;
    if (user != null) {
      data['user'] = user!.toJson();
    }
    return data;
  }
}

class UserModel {
  String? id;
  String? name;
  String? email;
  String? avatar;
  String? status;
  int? creditsUsed;
  int? creditsTotal;
  int? totalProject;
  int? totalEdit;
  String? kind;
  Plan? currentPlan;

  UserModel({
    this.id,
    this.name,
    this.email,
    this.avatar,
    this.status,
    this.creditsUsed,
    this.creditsTotal,
    this.kind,
    this.currentPlan,
    this.totalEdit,
    this.totalProject
  });

  UserModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    name = json['name'];
    email = json['email'];
    avatar = json['avatar'];
    status = json['status'];
    creditsUsed = int.tryParse(json['creditsUsed'].toString());
    creditsTotal = int.tryParse(json['creditsTotal'].toString());
    totalEdit = int.tryParse(json['edit_count'].toString());
    totalProject = int.tryParse(json['project_count'].toString());
    creditsTotal = int.tryParse(json['creditsTotal'].toString());
    kind = json['kind'];
    currentPlan = json['currentPlan'] != null ? Plan.fromJson(json['currentPlan']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['name'] = name;
    data['email'] = email;
    data['avatar'] = avatar;
    data['status'] = status;
    data['creditsUsed'] = creditsUsed;
    data['creditsTotal'] = creditsTotal;
    data['kind'] = kind;
    return data;
  }
}

class Plan {
  String? id;
  String? name;
  int? credits;
  double? price;
  String? purchasedAt;
  bool? recommended;

  Plan({this.id, this.name, this.credits, this.price, this.purchasedAt, this.recommended});

  Plan.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    name = json['name'];
    credits = int.tryParse(json['credits'].toString());
    price = double.tryParse(json['price'].toString());
    purchasedAt = json['purchasedAt'];
    recommended = json['recommended'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['name'] = name;
    data['credits'] = credits;
    data['price'] = price;
    data['purchasedAt'] = purchasedAt;
    data['recommended'] = recommended;
    return data;
  }
}

