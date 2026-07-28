class ConfigModel {
  bool? isDemo;
  String? androidMinimumAppVersion;
  String? iosMinimumAppVersion;
  String? androidAppDownloadLink;
  String? iosAppDownloadLink;
  Brand? brand;
  General? general;
  List<Oauth>? oauth;

  ConfigModel({
    this.isDemo,
    this.androidMinimumAppVersion,
    this.iosMinimumAppVersion,
    this.androidAppDownloadLink,
    this.iosAppDownloadLink,
    this.brand,
    this.general,
    this.oauth,
  });

  ConfigModel.fromJson(Map<String, dynamic> json) {
    isDemo = json['is_demo'];
    androidMinimumAppVersion = json['android_minimum_app_version']?.toString();
    iosMinimumAppVersion = json['ios_minimum_app_version']?.toString();
    androidAppDownloadLink = json['android_app_download_link'];
    iosAppDownloadLink = json['ios_app_download_link'];
    brand = json['brand'] != null ? Brand.fromJson(json['brand']) : null;
    general = json['general'] != null ? General.fromJson(json['general']) : null;
    if (json['oauth'] != null) {
      oauth = <Oauth>[];
      json['oauth'].forEach((v) {
        oauth!.add(Oauth.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['is_demo'] = isDemo;
    data['android_minimum_app_version'] = androidMinimumAppVersion;
    data['ios_minimum_app_version'] = iosMinimumAppVersion;
    data['android_app_download_link'] = androidAppDownloadLink;
    data['ios_app_download_link'] = iosAppDownloadLink;
    if (brand != null) {
      data['brand'] = brand!.toJson();
    }
    if (general != null) {
      data['general'] = general!.toJson();
    }
    if (oauth != null) {
      data['oauth'] = oauth!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Brand {
  String? name;
  String? slogan;
  String? logo;

  Brand({this.name, this.slogan, this.logo});

  Brand.fromJson(Map<String, dynamic> json) {
    name = json['name'];
    slogan = json['slogan'];
    logo = json['logo'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['name'] = name;
    data['slogan'] = slogan;
    data['logo'] = logo;
    return data;
  }
}

class General {
  String? country;
  String? currency;
  String? currencySymbol;

  General({this.country, this.currency, this.currencySymbol});

  General.fromJson(Map<String, dynamic> json) {
    country = json['country'];
    currency = json['currency'];
    currencySymbol = json['currencySymbol'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['country'] = country;
    data['currency'] = currency;
    data['currencySymbol'] = currencySymbol;
    return data;
  }
}

class Oauth {
  String? provider;
  String? name;

  Oauth({this.provider, this.name});

  Oauth.fromJson(Map<String, dynamic> json) {
    provider = json['provider'];
    name = json['name'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['provider'] = provider;
    data['name'] = name;
    return data;
  }
}
