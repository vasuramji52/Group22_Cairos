class User {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final bool isVerified;
  final GoogleAccount google;
  final String createdAt;
  final String updatedAt;

  User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.isVerified,
    required this.google,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'].toString(),
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      isVerified: json['isVerified'] ?? false,
      google: GoogleAccount.fromJson(json['google'] ?? {}),
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
    );
  }
}

class GoogleAccount {
  final bool connected;
  final String accountId;

  GoogleAccount({required this.connected, required this.accountId});

  factory GoogleAccount.fromJson(Map<String, dynamic> json) {
    return GoogleAccount(
      connected: json['connected'] ?? false,
      accountId: json['accountId']?.toString() ?? '',
    );
  }
}
