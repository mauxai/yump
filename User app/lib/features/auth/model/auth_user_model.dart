class AuthUserModel {
  final String name;
  final String email;
  final String photoUrl;
  final String phone;

  const AuthUserModel({
    required this.name,
    required this.email,
    required this.photoUrl,
    this.phone = '',
  });

  bool get isLoggedIn => email.isNotEmpty;
}
