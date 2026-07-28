class VerifyOtpResponse {
  final bool ok;
  final String token;
  final String kind;

  VerifyOtpResponse({required this.ok, required this.token, required this.kind});

  factory VerifyOtpResponse.fromJson(Map<String, dynamic> json) {
    return VerifyOtpResponse(
      ok: json['ok'] as bool? ?? false,
      token: json['token'] as String? ?? '',
      kind: json['kind'] as String? ?? '',
    );
  }
}
