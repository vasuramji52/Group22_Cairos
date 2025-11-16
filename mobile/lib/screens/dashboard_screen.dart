import 'package:flutter/material.dart';
import '../theme.dart';
import '../styles/card_ui_styles.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api_service.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';

class GoogleAccount {
  final bool connected;
  final String? accountId;

  GoogleAccount({required this.connected, this.accountId});

  factory GoogleAccount.fromJson(Map<String, dynamic> json) {
    return GoogleAccount(
      connected: json['connected'],
      accountId: json['accountId'],
    );
  }
}

class User {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final bool isVerified;
  final GoogleAccount google;
  final DateTime createdAt;
  final DateTime updatedAt;

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
      id: json['_id'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      email: json['email'],
      isVerified: json['isVerified'],
      google: GoogleAccount.fromJson(json['google']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  final Function(int) onNavigate;
  const DashboardScreen({super.key, required this.onNavigate});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool loading = true;
  bool connecting = false;
  bool googleConnected = false;
  User? user;

  @override
  void initState() {
    super.initState();
    loadUser();
  }

  Future<void> loadUser() async {
    try {
      final fetchedUser = await ApiService.getMeReal();
      if (fetchedUser != null) {
        setState(() {
          user = fetchedUser as User?;
          loading = false;
        });

        // Optional: persist user locally
        // You can use shared_preferences or flutter_secure_storage
        // Example with shared_preferences:
        // final prefs = await SharedPreferences.getInstance();
        // prefs.setString('user_data', jsonEncode(fetchedUser.toJson()));
      }
    } catch (err) {
      print("Failed to load user: $err");
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> handleConnectGoogle() async {
    setState(() => connecting = true);
    try {
      final res = await ApiService.api('/oauth/google/init');
      if (res.statusCode != 200) throw Exception('Failed to get auth URL');

      final data = json.decode(res.body);
      final urlString = data['url'];
      if (urlString == null) throw Exception('No auth URL from init');

      final url = Uri.parse(urlString);
      // Open the Google OAuth consent screen
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      } else {
        throw Exception('Could not launch $url');
      }
    } catch (error) {
      print('Failed to start Google OAuth: $error');
      setState(() => connecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            TopBanner(
              title: 'Welcome back, ${user?.firstName ?? 'User'}',
              subtitle: 'Find the perfect moment to connect',
              icon: const Icon(
                LucideIcons.clock,
                color: AppColors.gold,
                size: 50,
              ),
            ),
            const SizedBox(height: 24),
            Column(children: const [EgyptianBorder(), SizedBox(height: 16)]),

            PapyrusCard(
              margin: const EdgeInsets.all(16),
              icon: const Icon(
                LucideIcons.calendar,
                color: AppColors.darkTeal,
                size: 20,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Google Calendar Connection',
                    style: TextStyle(fontSize: 20, color: AppColors.darkTeal),
                  ),
                  SizedBox(height: 8),
                  Text(
                    user?.google.connected == true
                        ? "Your calendar is connected and synchronized"
                        : "Connect your calendar to start finding the perfect meeting times",
                    style: const TextStyle(color: AppColors.accentTeal),
                  ),
                  const SizedBox(height: 12),
                  if (user?.google.connected == true)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green[50],
                        border: Border.all(color: Colors.green[200]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(LucideIcons.sparkle, color: Colors.green),
                          SizedBox(width: 8),
                          Text(
                            "Connected successfully",
                            style: TextStyle(color: AppColors.darkTeal),
                          ),
                        ],
                      ),
                    )
                  else
                    ElevatedButton(
                      onPressed: connecting ? null : handleConnectGoogle,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.darkTeal,
                        foregroundColor: AppColors.gold,
                        side: const BorderSide(color: AppColors.gold, width: 2),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        connecting
                            ? "Connecting..."
                            : "Connect Google Calendar",
                      ),
                    ),
                ],
              ),
            ),

            //Your Circle
            GestureDetector(
              onTap: () => widget.onNavigate(1),
              child: PapyrusCard(
                icon: const Icon(
                  LucideIcons.users,
                  color: Color(0xFFC1440E),
                  size: 20,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Your Circle',
                      style: TextStyle(fontSize: 20, color: AppColors.darkTeal),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Manage your connections and companions',
                      style: TextStyle(
                        color: AppColors.accentTeal,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text(
                          'View and manage friends',
                          style: TextStyle(
                            color: AppColors.darkTeal,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          '→',
                          style: TextStyle(
                            color: AppColors.gold,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            //Find Time
            GestureDetector(
              onTap: () => widget.onNavigate(2),
              child: PapyrusCard(
                icon: const Icon(
                  LucideIcons.users,
                  color: Color(0xFFC1440E),
                  size: 20,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Find Time',
                      style: TextStyle(fontSize: 20, color: AppColors.darkTeal),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Combine schedules and discover perfect meeting times',
                      style: TextStyle(
                        color: AppColors.accentTeal,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          user?.google.connected == true
                              ? 'Start scheduling meetings'
                              : 'Connect calendar first',
                          style: const TextStyle(
                            color: AppColors.darkTeal,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            PapyrusCard(
              margin: const EdgeInsets.all(16), // mt-6
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Getting Started",
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.darkTeal, // #1B4B5A
                    ),
                  ),
                  const SizedBox(height: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Step 1
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 24,
                            height: 24,
                            decoration: const BoxDecoration(
                              color: AppColors.gold, // #D4AF37
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: const Text(
                              "1",
                              style: TextStyle(
                                color: AppColors.darkTeal, // #1B4B5A
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Flexible(
                            fit: FlexFit.loose,
                            child: Text(
                              user?.google.connected == true
                                  ? "✓ Calendar connected"
                                  : "Connect your Google Calendar to access your schedule",
                              style: const TextStyle(
                                color: AppColors.accentTeal, // #2C6E7E
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Step 2
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 24,
                            height: 24,
                            decoration: const BoxDecoration(
                              color: AppColors.gold,
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: const Text(
                              "2",
                              style: TextStyle(
                                color: AppColors.darkTeal,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Flexible(
                            fit: FlexFit.loose,
                            child: Text(
                              "Add friends to your circle by their email address",
                              style: TextStyle(
                                color: AppColors.accentTeal,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Step 3
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 24,
                            height: 24,
                            decoration: const BoxDecoration(
                              color: AppColors.gold,
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: const Text(
                              "3",
                              style: TextStyle(
                                color: AppColors.darkTeal,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Flexible(
                            fit: FlexFit.loose,
                            child: Text(
                              "Find the perfect time to meet by combining your schedules",
                              style: TextStyle(
                                color: AppColors.accentTeal,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
