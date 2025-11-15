import 'package:flutter/material.dart';
import '../theme.dart';
import '../styles/card_ui_styles.dart';
import 'package:lucide_icons/lucide_icons.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [ 
            TopBanner(
              title: 'Profile & Settings',
              subtitle: 'Manage your account preferences',
              icon: const Icon(
                LucideIcons.user,
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
                    'Connected Accounts',
                    style: TextStyle(fontSize: 20, color: AppColors.darkTeal),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Manage your connected calendar services',
                    style: TextStyle(color: AppColors.accentTeal),
                  ),
                  SizedBox(height: 8),
                ],
              ),
            ),
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
                    'Account Actions',
                    style: TextStyle(fontSize: 20, color: AppColors.darkTeal),
                  ),
                  SizedBox(height: 8),
                  
                ],
              ),
            ),
          ],
          ),
          
      ),
    );
  }
}
  