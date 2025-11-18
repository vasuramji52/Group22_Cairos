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
    final textTheme = Theme.of(context).textTheme;

    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.darkTeal, AppColors.accentTeal],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ---------- HEADER ----------
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Profile & Settings',
                          style: textTheme.headlineMedium?.copyWith(
                            color: AppColors.gold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Manage your connected calendar services',
                          style: textTheme.titleMedium?.copyWith(
                            color: AppColors.gold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const EgyptianBorder(),
                  const SizedBox(height: 24),

                  // ---------- CONNECTED ACCOUNTS ----------
                  PapyrusCard(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Connected Accounts',
                          style: textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.darkTeal,
                          ),
                        ),
                        const SizedBox(height: 16),
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
                                    child: Center(
                                      child: Text(
                                        'G',
                                        style: textTheme.bodyLarge?.copyWith(
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'Google Calendar',
                                    style: textTheme.bodyMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.darkTeal,
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
                                  style: textTheme.bodySmall?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: user?.google.connected == true
                                        ? Colors.green[900]
                                        : const Color(0xFFC1440E),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ---------- ACCOUNT ACTIONS ----------
                  PapyrusCard(
                    margin: const EdgeInsets.only(bottom: 32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Account Actions',
                          style: textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.darkTeal,
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Change Password
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: _showPasswordDialog,
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(
                                color: AppColors.accentTeal,
                                width: 1,
                              ),
                              padding:
                                  const EdgeInsets.symmetric(vertical: 12),
                              backgroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24),
                              ),
                            ),
                            child: Text(
                              'Change Password',
                              style: textTheme.bodyMedium?.copyWith(
                                color: AppColors.accentTeal,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 12),

                        // Logout
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: _showLogoutDialog,
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(
                                color: Color(0xFFC1440E),
                                width: 1,
                              ),
                              padding:
                                  const EdgeInsets.symmetric(vertical: 12),
                              backgroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  LucideIcons.logOut,
                                  color: Color(0xFFC1440E),
                                  size: 18,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Logout',
                                  style: textTheme.bodyMedium?.copyWith(
                                    color: const Color(0xFFC1440E),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ---------- FOOTER ----------
                  Center(
                    child: Column(
                      children: [
                        const Icon(
                          LucideIcons.sparkles,
                          color: AppColors.gold,
                          size: 32,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Cairos - Find Your Perfect Moment',
                          style: textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFFC5A572),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Version 1.1.6',
                          style: textTheme.bodySmall?.copyWith(
                            color: const Color(0xFFC5A572),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ---------- LOGOUT DIALOG ----------
  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (dialogCtx) {
        final textTheme = Theme.of(dialogCtx).textTheme;

        return AlertDialog(
          backgroundColor: AppColors.beige,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: const BorderSide(color: AppColors.gold),
          ),
          title: Text(
            'Logout?',
            style: textTheme.titleMedium?.copyWith(
              color: AppColors.darkTeal,
              fontWeight: FontWeight.w700,
            ),
          ),
          content: Text(
            'Are you sure you want to logout? You\'ll need to sign in again to access your account.',
            style: textTheme.bodyMedium?.copyWith(
              color: AppColors.accentTeal,
            ),
          ),
          actions: [
            OutlinedButton(
              onPressed: () => Navigator.pop(dialogCtx),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFC1440E), width: 1),
                backgroundColor: Colors.white,
              ),
              child: Text(
                'Cancel',
                style: textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFFC1440E),
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogCtx);
                doLogout();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
              ),
              child: Text(
                'Logout',
                style: textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  // ---------- PASSWORD RESET DIALOG ----------
  void _showPasswordDialog() {
    final emailController = TextEditingController();
    bool isLoading = false;

    showDialog(
      context: context,
      builder: (dialogCtx) {
        final textTheme = Theme.of(dialogCtx).textTheme;

        return StatefulBuilder(
          builder: (ctx, setDialogState) => AlertDialog(
            backgroundColor: AppColors.beige,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: const BorderSide(color: AppColors.gold),
            ),
            title: Text(
              'Reset your password',
              style: textTheme.titleMedium?.copyWith(
                color: AppColors.darkTeal,
                fontWeight: FontWeight.w700,
              ),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Enter your email address, and we\'ll send you a password reset link.',
                  style: textTheme.bodyMedium?.copyWith(
                    color: AppColors.accentTeal,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: textTheme.bodyMedium,
                  decoration: const InputDecoration(
                    hintText: 'you@gmail.com',
                    border: OutlineInputBorder(),
                    fillColor: Colors.white,
                    filled: true,
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
                                emailController.text.trim(),
                              );
                              if (mounted) {
                                showSuccessSnackBar(
                                  'If that email exists, a link was sent.',
                                );
                                Navigator.pop(dialogCtx);
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
                      style: textTheme.bodyMedium?.copyWith(
                        color: AppColors.gold,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            actions: [
              OutlinedButton(
                onPressed: () => Navigator.pop(dialogCtx),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFC1440E), width: 1),
                  backgroundColor: Colors.white,
                ),
                child: Text(
                  'Cancel',
                  style: textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFFC1440E),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
