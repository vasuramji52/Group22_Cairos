import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/services/api_service.dart';

class FriendsApi {
  /// ---------------------------
  /// GET FRIENDS LIST
  /// ---------------------------
  static Future<Map<String, dynamic>> getFriends() async {
    final res = await ApiService.api('/getfriends');

    if (res.statusCode == 200) {
      return json.decode(res.body);
    } else {
      throw Exception('Failed to load friends');
    }
  }

  /// ---------------------------
  /// ADD FRIEND (by email)
  /// ---------------------------
  static Future<Map<String, dynamic>> addFriend(String friendEmail) async {
    final res = await ApiService.api(
      '/addfriend',
      method: 'POST',
      body: {'friendEmail': friendEmail},
    );

    return json.decode(res.body);
  }

  /// ---------------------------
  /// ACCEPT FRIEND REQUEST
  /// ---------------------------
  static Future<Map<String, dynamic>> acceptFriend(String requesterId) async {
    final res = await ApiService.api(
      '/acceptfriend',
      method: 'POST',
      body: {'requesterId': requesterId},
    );

    return json.decode(res.body);
  }

  /// ---------------------------
  /// DECLINE FRIEND REQUEST
  /// ---------------------------
  static Future<Map<String, dynamic>> declineFriend(String requesterId) async {
    final res = await ApiService.api(
      '/declinefriend',
      method: 'POST',
      body: {'requesterId': requesterId},
    );

    return json.decode(res.body);
  }

  /// ---------------------------
  /// REMOVE FRIEND
  /// ---------------------------
  static Future<Map<String, dynamic>> removeFriend(String friendEmail) async {
    final res = await ApiService.api(
      '/removefriend',
      method: 'POST',
      body: {'friendEmail': friendEmail},
    );

    return json.decode(res.body);
  }
}
