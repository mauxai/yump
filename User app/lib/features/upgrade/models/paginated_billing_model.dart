import 'package:lumen/common/models/auth_response.dart';
import 'package:lumen/features/activity/models/paginated_activity_model.dart';

class PaginatedBillingModel {
  List<BillingModel>? history;
  Pagination? pagination;

  PaginatedBillingModel({this.history, this.pagination});

  PaginatedBillingModel.fromJson(Map<String, dynamic> json) {
    if (json['history'] != null) {
      history = <BillingModel>[];
      json['history'].forEach((v) {
        history!.add(BillingModel.fromJson(v));
      });
    }
    pagination = json['pagination'] != null ? Pagination.fromJson(json['pagination']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    if (history != null) {
      data['history'] = history!.map((v) => v.toJson()).toList();
    }
    if (pagination != null) {
      data['pagination'] = pagination!.toJson();
    }
    return data;
  }
}

class BillingModel {
  String? id;
  double? amount;
  String? currency;
  String? status;
  String? description;
  int? creditsGranted;
  String? gatewayRef;
  String? createdAt;
  Plan? plan;

  BillingModel({
    this.id,
    this.amount,
    this.currency,
    this.status,
    this.description,
    this.creditsGranted,
    this.gatewayRef,
    this.createdAt,
    this.plan,
  });

  BillingModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    amount = double.tryParse(json['amount'].toString());
    currency = json['currency'];
    status = json['status'];
    description = json['description'];
    creditsGranted = int.tryParse(json['creditsGranted'].toString());
    gatewayRef = json['gatewayRef'];
    createdAt = json['createdAt'];
    plan = json['plan'] != null ? Plan.fromJson(json['plan']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['amount'] = amount;
    data['currency'] = currency;
    data['status'] = status;
    data['description'] = description;
    data['creditsGranted'] = creditsGranted;
    data['gatewayRef'] = gatewayRef;
    data['createdAt'] = createdAt;
    if (plan != null) {
      data['plan'] = plan!.toJson();
    }
    return data;
  }
}
