class PaymentGateway {
  List<Gateways>? gateways;

  PaymentGateway({this.gateways});

  PaymentGateway.fromJson(Map<String, dynamic> json) {
    if (json['gateways'] != null) {
      gateways = <Gateways>[];
      json['gateways'].forEach((v) {
        gateways!.add(Gateways.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    if (gateways != null) {
      data['gateways'] = gateways!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Gateways {
  String? id;
  String? slug;
  String? title;
  String? logo;
  Public? public;

  Gateways({this.id, this.slug, this.title, this.logo, this.public});

  Gateways.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    slug = json['slug'];
    title = json['title'];
    logo = json['logo'];
    public = json['public'] != null ? Public.fromJson(json['public']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['slug'] = slug;
    data['title'] = title;
    data['logo'] = logo;
    if (public != null) {
      data['public'] = public!.toJson();
    }
    return data;
  }
}

class Public {
  String? publishableKey;
  String? currency;

  Public({this.publishableKey, this.currency});

  Public.fromJson(Map<String, dynamic> json) {
    publishableKey = json['publishable_key'];
    currency = json['currency'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['publishable_key'] = publishableKey;
    data['currency'] = currency;
    return data;
  }
}
