import 'package:flutter/material.dart';
import 'package:mobile/screens/bottom_nav.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'package:google_fonts/google_fonts.dart';
import 'auth_page_layout.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';
import 'dart:convert';
import 'card_ui.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  String message = '';

  void login() async {
    final email = emailController.text;
    final password = passwordController.text;

    final response = await ApiService.loginUser(email, password);
    final body = response.body;

    if (response.statusCode == 200) {
      setState(() => message = 'Login successful!');

      final token=(json.decode(response.body))['accessToken'] as String;
      await ApiService.storeToken(token);

      // navigate to CardUI page on success
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const BottomNav()),
      );
      
      return;
      
    } else {
      // Decode backend error message
      String errorMsg = 'Login failed. Please try again.';
      try {
        final Map<String, dynamic> json = jsonDecode(body);
        if (json['error'] == 'User email not verified') {
          errorMsg = 'Please verify your email before logging in.';
        } else if (json['error'] == 'Invalid email' ||
            json['error'] == 'Invalid password') {
          errorMsg = 'Invalid email or password.';
        } else if (json['error'] == 'missing_fields') {
          errorMsg = 'Please fill in all fields.';
        }
      } catch (_) {}

      setState(() => message = errorMsg);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthPageLayout(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Welcome Back',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.darkTeal,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Log in to seize your kairos',
            style: TextStyle(color: AppColors.darkTeal),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: emailController,
            decoration: InputDecoration(
              labelText: 'Email',
              filled: true,
              fillColor: Colors.white.withOpacity(0.8),
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: passwordController,
            obscureText: true,
            decoration: InputDecoration(
              labelText: 'Password',
              filled: true,
              fillColor: Colors.white.withOpacity(0.8),
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: login,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accentTeal,
              foregroundColor: AppColors.gold,
              minimumSize: const Size(double.infinity, 48),
            ),
            child: const Text('Log In'),
          ),

          TextButton(
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
              );
            },
            child: const Text(
              'Forgot Password?',
              style: TextStyle(color: AppColors.accentTeal),
            ),
          ),

          TextButton(
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const RegisterScreen()),
              );
            },
            child: const Text(
              "Don't have an account? Sign up",
              style: TextStyle(color: AppColors.accentTeal),
            ),
          ),

          const SizedBox(height: 8),
          Text(message, style: const TextStyle(color: Colors.redAccent)),
        ],
      ),
    );
  }
}
