class UIFriend {
  final String id;
  final String email;
  final String nickname;
  final String firstName;
  final String lastName;

  UIFriend({
    required this.id,
    required this.email,
    required this.nickname,
    required this.firstName,
    required this.lastName,
  });

  factory UIFriend.fromJson(Map<String, dynamic> json) {
    final fullName =
        "${json['firstName'] ?? ''} ${json['lastName'] ?? ''}".trim();

    return UIFriend(
      id: json['_id'].toString(),
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      nickname: fullName.isNotEmpty
          ? fullName
          : (json['email']?.split("@")[0] ?? "Friend"),
    );
  }
}
