import 'package:flutter/material.dart';
import '../theme.dart';
import '../styles/card_ui_styles.dart';
import 'package:lucide_icons/lucide_icons.dart';

class ScheduleScreen extends StatelessWidget {
  const ScheduleScreen({super.key});

  final List<Map<String, String>> schedule = const [
    {'day': 'Monday', 'time': '2:00 PM', 'title': 'Team Standup'},
    {'day': 'Wednesday', 'time': '10:00 AM', 'title': 'Project Review'},
    {'day': 'Friday', 'time': '3:30 PM', 'title': 'Client Call'},
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TopBanner(
              title: 'Find the Perfect Time',
              subtitle: 'Combine schedules to discover your Kairos',
              icon: const Icon(
                LucideIcons.clock,
                color: AppColors.gold,
                size: 50,
              ),
            ),
            const SizedBox(height: 24),
            Column(children: const [EgyptianBorder(), SizedBox(height: 16)]),
          ],
        ),
      ),
    );
  }
}
