import 'package:flutter/material.dart';
import '../theme.dart';
import '../services/api_service.dart';
import 'auth_page_layout.dart';
import 'login_screen.dart';

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
    } else if (response.statusCode == 409) {
      setState(() => status = 'An account with that email already exists.');
    } else {
      setState(() => status = 'Registration failed. Please try again.');
    }

    setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return AuthPageLayout(
      tagline: "Begin your journey with CAIROS",
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Create Account',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.darkTeal,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Join CAIROS and capture every opportunity',
            style: TextStyle(color: AppColors.darkTeal),
          ),
          const SizedBox(height: 20),

          // First Name
          TextField(
            controller: firstNameController,
            decoration: const InputDecoration(
              labelText: 'First Name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),

          // Last Name
          TextField(
            controller: lastNameController,
            decoration: const InputDecoration(
              labelText: 'Last Name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),

          // Email
          TextField(
            controller: emailController,
            decoration: const InputDecoration(
              labelText: 'Email',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),

          // Password
          TextField(
            controller: passwordController,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Password (min 8 chars)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 24),

          ElevatedButton(
            onPressed: loading ? null : register,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accentTeal,
              foregroundColor: AppColors.gold,
              minimumSize: const Size(double.infinity, 48),
            ),
            child: Text(loading ? 'Creating account...' : 'Sign Up'),
          ),
          const SizedBox(height: 12),

          Text(
            status,
            style: const TextStyle(color: AppColors.darkTeal, fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),

          // Link back to login
          TextButton(
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
            child: const Text(
              'Already have an account? Log in',
              style: TextStyle(color: AppColors.accentTeal),
            ),
          ),
        ],
      ),
    );
  }
}
