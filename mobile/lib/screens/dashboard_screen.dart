import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme.dart';
import '../styles/card_ui_styles.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int) onNavigate;
  const DashboardScreen({super.key, required this.onNavigate});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool loading = true;
  bool connecting = false;
  User? user;

  @override
  void initState() {
    super.initState();
    loadUser();
  }

  Future<void> loadUser() async {
    try {
      final fetchedUser = await ApiService.getMeReal();
      setState(() {
        user = fetchedUser;
        loading = false;
      });
    } catch (err) {
      debugPrint("Failed to load user: $err");
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
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      } else {
        throw Exception('Could not launch $url');
      }
    } catch (error) {
      debugPrint('Failed to start Google OAuth: $error');
      setState(() => connecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: loadUser,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 🔹 HEADER 1 — Cinzel via headlineMedium (keep special)
            Text(
              'Welcome back, ${user?.firstName ?? 'Explorer'}',
              style: textTheme.headlineMedium?.copyWith(color: AppColors.gold),
            ),
            const SizedBox(height: 4),

            // 🔹 HEADER 2 — Cormorant via titleMedium (keep special)
            Text(
              'Find the perfect moment to connect',
              style: textTheme.titleMedium?.copyWith(
                color: AppColors.gold,
              ),
            ),
            const SizedBox(height: 24),

            const EgyptianBorder(),
            const SizedBox(height: 16),

            // Google Calendar connection card
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
                    style: textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.darkTeal,
                    ),
                  ),
                  const SizedBox(height: 8),
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
                          const Icon(LucideIcons.sparkle, color: Colors.green),
                          const SizedBox(width: 8),
                          Text(
                            'Connected successfully',
                            style: textTheme.bodyMedium?.copyWith(
                              color: AppColors.darkTeal,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    FilledButton.icon(
                      onPressed: connecting ? null : handleConnectGoogle,
                      icon: connecting
                          ? const SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(LucideIcons.link),
                      label: Text(
                        connecting
                            ? 'Connecting...'
                            : 'Connect Google Calendar',
                        style: textTheme.bodyMedium,
                      ),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: AppColors.darkTeal,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Your Circle card — NOW WITH ICON
            PapyrusCard(
              icon: const Icon(
                LucideIcons.users, // 👈 ADDED
                color: AppColors.darkTeal,
                size: 20,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your Circle',
                    style: textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.darkTeal,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'View and manage your companions',
                    style: textTheme.bodyMedium?.copyWith(
                      color: AppColors.darkTeal.withOpacity(0.8),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      FilledButton(
                        onPressed: () => widget.onNavigate(1),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: AppColors.darkTeal,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text('View and manage friends'),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Find Time card — NOW WITH ICON
            PapyrusCard(
              icon: const Icon(
                LucideIcons.clock, // 👈 ADDED
                color: AppColors.darkTeal,
                size: 20,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Find Time',
                    style: textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.darkTeal,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.google.connected == true
                        ? 'Start scheduling meetings'
                        : 'Connect your calendar first',
                    style: textTheme.bodyMedium?.copyWith(
                      color: AppColors.darkTeal.withOpacity(0.8),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      FilledButton(
                        onPressed: user?.google.connected == true
                            ? () => widget.onNavigate(2)
                            : null,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: AppColors.darkTeal,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          user?.google.connected == true
                              ? 'Start scheduling meetings'
                              : 'Connect calendar first',
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
