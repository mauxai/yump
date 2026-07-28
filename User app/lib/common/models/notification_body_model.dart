import 'package:lumen/util/enums.dart';

class NotificationBody {
  String? title;
  String? body;
  String? type;
  String? image;
  String? projectId;
  String? projectName;

  NotificationBody({this.title, this.body, this.type, this.image, this.projectId, this.projectName});

  NotificationBody.fromJson(Map<String, dynamic> json) {
    title = json['title']?.toString();
    body = json['body']?.toString();
    type = json['notification_type']?.toString();
    image = json['image']?.toString();
    projectId = json['project_id']?.toString();
    projectName = json['project_name']?.toString();
  }

  NotificationType? get notificationType => NotificationType.fromValue(type);

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['title'] = title;
    data['body'] = body;
    data['notification_type'] = type;
    data['image'] = image;
    data['project_id'] = projectId;
    data['project_name'] = projectName;
    return data;
  }
}
