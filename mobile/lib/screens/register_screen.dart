import 'package:flutter/material.dart';
import '../theme.dart';
import '../services/api_service.dart';
import 'auth_page_layout.dart';
import 'login_screen.dart';
import 'dart:convert';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  String status = '';
  bool loading = false;

  void register() async {
    setState(() {
      status = '';
      loading = true;
    });

    final response = await ApiService.registerUser(
      firstNameController.text,
      lastNameController.text,
      emailController.text,
      passwordController.text,
    );
    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      setState(
        () => status = 'Success! Check your email to verify your account.',
      );
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    } else if (data["error"] == "missing_fields") {
      setState(() => status = "Please complete all fields.");
    } else if (response.statusCode == 409) {
      setState(() => status = 'An account with that email already exists.');
    } else {
      setState(() => status = 'Registration failed. Please try again.');
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
                Text(
                  'Find your moment',
                  style: textTheme.titleMedium?.copyWith(
                    color: AppColors.bronze,
                  ),
                ),
                const SizedBox(height: 28),

                //Register card
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
                        'Create Account',
                        style: TextStyle(
                          fontFamily: 'Nunito',
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: AppColors.darkTeal,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Join CAIROS and capture every opportunity',
                        style: TextStyle(
                          fontFamily: 'Nunito',
                          color: AppColors.accentTeal,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // First Name
                      TextField(
                        controller: firstNameController,
                        style: const TextStyle(fontFamily: 'Nunito'),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(
                            Icons.font_download,
                            color: AppColors.accentTeal,
                          ),
                          labelText: 'First Name',
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

                      // Last Name
                      TextField(
                        controller: lastNameController,
                        decoration: InputDecoration(
                          prefixIcon: const Icon(
                            Icons.font_download,
                            color: AppColors.accentTeal,
                          ),
                          labelText: 'Last Name',
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

                      // Email
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
                      const SizedBox(height: 16),

                      // Password
                      TextField(
                        controller: passwordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'Password (min 8 chars)',
                          prefixIcon: const Icon(
                            Icons.lock,
                            color: AppColors.accentTeal,
                          ),

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
                      const SizedBox(height: 24),

                      //register button
                      SizedBox(
                        width: double.infinity,
                        height: 46,
                        child: ElevatedButton(
                          onPressed: loading ? null : register,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.accentTeal,
                            foregroundColor: AppColors.gold,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                          ),
                          child: Text(
                            loading ? 'Creating account...' : 'Sign Up',
                            style: TextStyle(
                              fontFamily: 'Nunito',
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),

                      if (status.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Text(
                            status,
                            style: const TextStyle(
                              fontFamily: 'Nunito',
                              color: Colors.redAccent,
                              fontSize: 13,
                            ),
                          ),
                        ),

                      // Link back to login
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
                          'Already have an account? Log in',
                          style: TextStyle(
                            fontFamily: 'Nunito',
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
