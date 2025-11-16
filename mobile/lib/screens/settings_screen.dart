import 'package:flutter/material.dart';
import '../theme.dart';
import '../styles/card_ui_styles.dart';
import '../services/api_service.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/user.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  User? user;
  bool loading = true;
  bool showPasswordDialog = false;
  bool showLogoutDialog = false;

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
          user = User(
            id: fetchedUser.id,
            firstName: fetchedUser.firstName,
            lastName: fetchedUser.lastName,
            email: fetchedUser.email,
            isVerified: fetchedUser.isVerified,
            google: GoogleAccount(
              connected: fetchedUser.google.connected,
              accountId: fetchedUser.google.accountId,
            ),
            createdAt: fetchedUser.createdAt,
            updatedAt: fetchedUser.updatedAt,
          );
          loading = false;
        });
      }
    } catch (err) {
      debugPrint("Failed to load user: $err");
      setState(() => loading = false);
    }
  }

  void doLogout() {
    Navigator.pushReplacementNamed(context, '/login');
  }

  void showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.green),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Icon
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

            // Connected Accounts Card
            PapyrusCard(
              margin: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Connected Accounts',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.darkTeal,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Manage your connected calendar services',
                    style: TextStyle(color: AppColors.accentTeal),
                  ),
                  const SizedBox(height: 16),
                  // Google Calendar Connection Status
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.gold, width: 1),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.white,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: Colors.blue,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Center(
                                child: Text(
                                  'G',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'Google Calendar',
                              style: TextStyle(
                                color: AppColors.darkTeal,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: user?.google.connected == true
                                ? Colors.green[100]
                                : const Color(0xFFF2B9A0),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            user?.google.connected == true
                                ? 'Connected'
                                : 'Not Connected',
                            style: TextStyle(
                              color: user?.google.connected == true
                                  ? Colors.green[900]
                                  : const Color(0xFFC1440E),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Account Actions Card
            PapyrusCard(
              margin: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Account Actions',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.darkTeal,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Change Password Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        _showPasswordDialog();
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(
                          color: AppColors.accentTeal,
                          width: 1,
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: Colors.white,
                      ),
                      child: const Text(
                        'Change Password',
                        style: TextStyle(color: AppColors.accentTeal),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Logout Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        _showLogoutDialog();
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(
                          color: Color(0xFFC1440E),
                          width: 1,
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: Colors.white,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            LucideIcons.logOut,
                            color: Color(0xFFC1440E),
                            size: 18,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Logout',
                            style: TextStyle(color: Color(0xFFC1440E)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // App Info
            const SizedBox(height: 32),
            Center(
              child: Column(
                children: const [
                  Icon(LucideIcons.sparkles, color: AppColors.gold, size: 32),
                  SizedBox(height: 12),
                  Text(
                    'Cairos - Find Your Perfect Moment',
                    style: TextStyle(color: Color(0xFFC5A572), fontSize: 14),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Version 1.1.6',
                    style: TextStyle(color: Color(0xFFC5A572), fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // Logout Confirmation Dialog
  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.beige,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(10)),
          side: BorderSide(color: AppColors.gold),
        ),
        title: const Text(
          'Logout?',
          style: TextStyle(color: AppColors.darkTeal),
        ),
        content: const Text(
          'Are you sure you want to logout? You\'ll need to sign in again to access your account.',
          style: TextStyle(color: AppColors.accentTeal),
        ),
        actions: [
          OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFC1440E), width: 1),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Color(0xFFC1440E)),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              doLogout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // Password Reset Dialog
  void _showPasswordDialog() {
    final emailController = TextEditingController();
    bool isLoading = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppColors.beige,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(10)),
            side: BorderSide(color: AppColors.gold),
          ),
          title: const Text(
            'Reset your password',
            style: TextStyle(color: AppColors.darkTeal),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Enter your email address, and we\'ll send you a password reset link.',
                style: TextStyle(color: AppColors.accentTeal),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  hintText: 'you@gmail.com',
                  border: OutlineInputBorder(
                    borderSide: const BorderSide(color: AppColors.accentTeal),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: AppColors.darkTeal),
                  ),
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLoading
                      ? null
                      : () async {
                          setDialogState(() => isLoading = true);
                          try {
                            await ApiService.forgotPassword(
                              emailController.text,
                            );
                            if (mounted) {
                              showSuccessSnackBar(
                                'If that email exists, a link was sent.',
                              );
                              Navigator.pop(context);
                            }
                          } catch (e) {
                            if (mounted) {
                              showErrorSnackBar('Failed to send reset link');
                            }
                          } finally {
                            setDialogState(() => isLoading = false);
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentTeal,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    isLoading ? 'Sending...' : 'Send reset link',
                    style: const TextStyle(color: AppColors.gold),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFC1440E), width: 1),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                backgroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Cancel',
                style: TextStyle(color: Color(0xFFC1440E)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
