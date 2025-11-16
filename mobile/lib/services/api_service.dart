import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/material.dart';
import '../screens/dashboard_screen.dart';

class ApiService {
  /// 👇 Use the production API when deployed
  static const String prodBaseUrl = 'https://api.vasupradha.xyz/api';

  /// 👇 Use local server when testing on an Android emulator
  /// (Flutter uses 10.0.2.2 instead of localhost)
  static const String localBaseUrl = 'http://localhost:5000/api';

  /// 👇 Choose the correct one automatically
  static const bool useLocal = true; // change to false for production
  static String get baseUrl => useLocal ? localBaseUrl : prodBaseUrl;

  // Use secure storage for storing token (instead of localStorage)
  static final storage = FlutterSecureStorage();

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

  static Future<void> storeToken(String accessToken) async {
    try {
      await storage.write(key: 'token_data', value: accessToken);
    } catch (e) {
      debugPrint('Error storing token: $e');
    }
  }

  static Future<http.Response> api(
    String path, {
    Map<String, String>? headers,
    Map<String, dynamic>? body,
    String method = 'GET',
  }) async {
    // Get token from secure storage
    final token = await storage.read(key: 'token_data');

    final defaultHeaders = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      if (headers != null) ...headers,
    };

    final uri = Uri.parse('$baseUrl$path');

    http.Response response;

    try {
      
      response = await http.get(uri, headers: defaultHeaders);
      

      if (response.statusCode == 401) {
        // Token invalid / not logged in → redirect
        await storage.delete(key: 'token_data');
        // Navigate to login screen (replace with your Navigator logic)
        // Note: Cannot redirect like in browser; use Navigator in Flutter
        throw Exception('Unauthorized, navigate to login');
      }

      return response;
    } catch (e) {
      rethrow;
    }
  }

  static Future<User?> getMeReal() async {
    try {
      final res = await api('/me'); // GET by default
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        return User.fromJson(data['user']);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching user: $e');
      return null;
    }
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