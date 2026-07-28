class ApiErrorResponse {
  final String? message;
  final Map<String, List<String>> errors;

  ApiErrorResponse({this.message, this.errors = const {}});

  factory ApiErrorResponse.fromJson(dynamic json) {
    if (json is! Map) return ApiErrorResponse();

    final String? message = json['message'] is String ? json['message'] as String : null;
    final Map<String, List<String>> parsedErrors = {};

    final dynamic rawErrors = json['errors'];
    if (rawErrors is Map) {
      rawErrors.forEach((key, value) {
        final String field = key.toString();
        if (value is List) {
          parsedErrors[field] = value.map((e) => e.toString()).toList();
        } else if (value is String) {
          parsedErrors[field] = [value];
        }
      });
    }

    return ApiErrorResponse(message: message, errors: parsedErrors);
  }

  String? get firstError {
    for (final list in errors.values) {
      if (list.isNotEmpty) return list.first;
    }
    return null;
  }

  List<String> get allErrors {
    final List<String> list = [];
    for (final entries in errors.values) {
      list.addAll(entries);
    }
    return list;
  }

  String displayMessage(String fallback) {
    final String? first = firstError;
    if (first != null && first.isNotEmpty) return first;
    if (message != null && message!.isNotEmpty) return message!;
    return fallback;
  }
}
