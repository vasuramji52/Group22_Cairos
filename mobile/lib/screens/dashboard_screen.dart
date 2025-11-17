import 'package:flutter/material.dart';
import '../theme.dart';
import '../styles/card_ui_styles.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api_service.dart';
import '../models/user.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';

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
          user = fetchedUser;
          loading = false;
        });
      } else {
        setState(() => loading = false);
      }
    } catch (err) {
      print("Failed to load user: $err");
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
                        backgroundColor: AppColors.gold,
                        foregroundColor: AppColors.darkTeal,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        connecting
                            ? "Connecting..."
                            : "Connect Google Calendar",
                        style: TextStyle(fontSize: 14),
                      ),
                    ),
                ],
              ),
            ),

            //Your Circle
            PapyrusCard(
              icon: const Icon(
                LucideIcons.users,
                color: AppColors.darkTeal,
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ElevatedButton(
                        onPressed: () => widget.onNavigate(1),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: AppColors.darkTeal,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text(
                          'View and manage friends',
                          style: TextStyle(fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            //Find Time
            PapyrusCard(
                icon: const Icon(
                  LucideIcons.clock,
                  color: AppColors.darkTeal,
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
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        ElevatedButton(
                          onPressed: () => widget.onNavigate(2),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: AppColors.darkTeal,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: Text(
                            user?.google.connected == true
                                ? 'Start scheduling meetings'
                                : 'Connect calendar first',
                            style: const TextStyle(fontSize: 14),
                          ),
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
