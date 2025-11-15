import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  /// 👇 Use the production API when deployed
  static const String prodBaseUrl = 'https://api.vasupradha.xyz/api';

  /// 👇 Use local server when testing on an Android emulator
  /// (Flutter uses 10.0.2.2 instead of localhost)
  static const String localBaseUrl = 'http://192.168.86.32:5000/api';

  /// 👇 Choose the correct one automatically
  static const bool useLocal = true; // change to false for production
  static String get baseUrl => useLocal ? localBaseUrl : prodBaseUrl;

  static Future<http.Response> loginUser(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    return response;
  }

  static Future<http.Response> registerUser(
    String firstName,
    String lastName,
    String email,
    String password,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/register'),
      headers: {
        'Content-Type': 'application/json',
        'x-platform': 'flutter', // <— lets backend know this is from mobile
      },
      body: jsonEncode({
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
      }),
    );
    return response;
  }

  static Future<http.Response> forgotPassword(String email) async {
    final response = await http.post(
      Uri.parse('$baseUrl/request-password-reset'),
      headers: {'Content-Type': 'application/json', 'x-platform': 'flutter'},
      body: jsonEncode({'email': email, 'platform': 'flutter'}),
    );
    return response;
  }

  static Future<http.Response> confirmResetPassword(
    String uid,
    String token,
    String newPassword,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/confirm-reset-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'uid': uid,
        'token': token,
        'newPassword': newPassword,
      }),
    );

    return response;
  }
}
