import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'auth_page_layout.dart';
import 'login_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final emailController = TextEditingController();
  String message = '';

  bool loading = false;

  void requestReset() async {
    final email = emailController.text;
    setState(() {
      loading = true;
    });

    final response = await ApiService.forgotPassword(email);
    final body = response.body;

    if (response.statusCode == 200) {
      setState(() => message = 'If that email exists, a link was sent.');
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    } else {
      setState(() => message = 'Resetting password failed. Please try again.');
    }

    setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      backgroundColor: AppColors.darkTeal,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // ---- LOGO + SLOGAN ----
                const Icon(Icons.access_time, color: AppColors.gold, size: 48),
                const SizedBox(height: 10),

                // HERO TITLE — use theme like Settings / Dashboard
                Text(
                  'Cairos',
                  style: textTheme.headlineMedium?.copyWith(
                    color: AppColors.gold,
                  ),
                ),
                const SizedBox(height: 4),

                // HERO SUBTITLE — same pattern as Settings subtitle
                Text(
                  'Find your moment',
                  style: textTheme.titleMedium?.copyWith(
                    color: AppColors.bronze,
                  ),
                ),

                const SizedBox(height: 28),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    vertical: 26,
                    horizontal: 20,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.beige,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: AppColors.gold, width: 1.3),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'Reset Password',
                        style: TextStyle(
                          fontFamily: 'Nunito',
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: AppColors.darkTeal,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Enter your email and we\'ll send you a magic link',
                        style: TextStyle(
                          fontFamily: 'Nunito',
                          color: AppColors.accentTeal,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 22),

                      TextField(
                        controller: emailController,
                        decoration: InputDecoration(
                          prefixIcon: const Icon(
                            Icons.email_outlined,
                            color: AppColors.accentTeal,
                          ),
                          labelText: 'Email',
                          labelStyle: const TextStyle(fontFamily: 'Nunito'),
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: AppColors.darkTeal,
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      //send reset link button
                      SizedBox(
                        width: double.infinity,
                        height: 46,
                        child: ElevatedButton(
                          onPressed: loading ? null : requestReset,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.accentTeal,
                            foregroundColor: AppColors.gold,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                          ),
                          child: Text(
                            loading ? 'Sending...' : 'Send Reset Link',
                            style: TextStyle(
                              fontFamily: 'Nunito',
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),

                      if (message.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Text(
                            message,
                            style: const TextStyle(
                              fontFamily: 'Nunito',
                              color: Colors.redAccent,
                              fontSize: 13,
                            ),
                          ),
                        ),

                      TextButton(
                        onPressed: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const LoginScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          'Remembered your password? Back to Login',
                          style: TextStyle(
                            color: AppColors.accentTeal,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
