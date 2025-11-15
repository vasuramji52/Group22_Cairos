import 'package:flutter/material.dart';
import '../theme.dart';

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
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.accentTeal, AppColors.darkTeal],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Settings',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Manage your account preferences',
                    style: TextStyle(
                      color: Color(0xFFC5A572),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Account Section
            const Text(
              'Account',
              style: TextStyle(
                color: AppColors.darkTeal,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _settingsTile('Edit Profile', Icons.person, () {}),
            _settingsTile('Change Password', Icons.lock, () {}),
            _settingsTile('Email Preferences', Icons.email, () {}),

            const SizedBox(height: 24),

            // Privacy & Security Section
            const Text(
              'Privacy & Security',
              style: TextStyle(
                color: AppColors.darkTeal,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _settingsTile('Privacy Settings', Icons.privacy_tip, () {}),
            _settingsTile('Blocked Users', Icons.block, () {}),
            _settingsTile('Two-Factor Authentication', Icons.security, () {}),

            const SizedBox(height: 24),

            // Preferences Section
            const Text(
              'Preferences',
              style: TextStyle(
                color: AppColors.darkTeal,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _settingsTile('Notifications', Icons.notifications, () {}),
            _settingsTile('Language', Icons.language, () {}),
            _settingsTile('Theme', Icons.palette, () {}),

            const SizedBox(height: 24),

            // Danger Zone
            const Text(
              'Danger Zone',
              style: TextStyle(
                color: Colors.red,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Log Out'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _settingsTile(String title, IconData icon, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        tileColor: Colors.grey[100],
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: AppColors.gold, width: 0.8),
        ),
        leading: Icon(icon, color: AppColors.accentTeal),
        title: Text(
          title,
          style: const TextStyle(
            color: AppColors.darkTeal,
            fontWeight: FontWeight.w600,
          ),
        ),
        trailing: const Icon(Icons.chevron_right, color: AppColors.accentTeal),
        onTap: onTap,
      ),
    );
  }
}
