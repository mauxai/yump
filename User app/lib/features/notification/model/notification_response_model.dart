class NotificationResponseModel {
  List<Notifications>? notifications;
  int? unreadCount;
  int? total;
  int? page;
  int? pageSize;
  int? totalPages;

  NotificationResponseModel(
      {this.notifications,
        this.unreadCount,
        this.total,
        this.page,
        this.pageSize,
        this.totalPages});

  NotificationResponseModel.fromJson(Map<String, dynamic> json) {
    if (json['notifications'] != null) {
      notifications = <Notifications>[];
      json['notifications'].forEach((v) {
        notifications!.add(Notifications.fromJson(v));
      });
    }
    unreadCount = json['unreadCount'];
    total = json['total'];
    page = json['page'];
    pageSize = json['pageSize'];
    totalPages = json['totalPages'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    if (notifications != null) {
      data['notifications'] =
          notifications!.map((v) => v.toJson()).toList();
    }
    data['unreadCount'] = unreadCount;
    data['total'] = total;
    data['page'] = page;
    data['pageSize'] = pageSize;
    data['totalPages'] = totalPages;
    return data;
  }
}

class Notifications {
  String? id;
  String? title;
  String? body;
  Data? data;
  bool? isRead;
  String? createdAt;

  Notifications({this.id, this.title, this.body, this.data, this.isRead, this.createdAt});

  Notifications.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    title = json['title'];
    body = json['body'];
    data = json['data'] != null ? Data.fromJson(json['data']) : null;
    isRead = json['isRead'];
    createdAt = json['createdAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['title'] = title;
    data['body'] = body;
    if (this.data != null) {
      data['data'] = this.data!.toJson();
    }
    data['isRead'] = isRead;
    data['createdAt'] = createdAt;
    return data;
  }
}

class Data {
  String? projectId;
  String? projectName;
  String? editId;
  String? image;
  String? notificationType;


  Data({
    this.projectId,
    this.projectName,
    this.editId,
    this.image,
    this.notificationType,
  });

  Data.fromJson(Map<String, dynamic> json) {
    projectId = json['project_id'];
    projectName = json['project_name'];
    editId = json['edit_id'];
    image = json['image'];
    notificationType = json['notification_type'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['project_id'] = projectId;
    data['project_name'] = projectName;
    data['edit_id'] = editId;
    data['image'] = image;
    data['notification_type'] = notificationType;
    return data;
  }
}
