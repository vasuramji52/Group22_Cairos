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
        final body=response.body;

        if (response.statusCode == 200) {
            setState(() =>
                message = 'If that email exists, a link was sent.'
            );
            await Future.delayed(const Duration(seconds: 2));
            if (mounted) {
                Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
            }
        }else{
            setState(() => message = 'Resetting password failed. Please try again.');
        }
    
        setState(() => loading = false);
    }


    @override
    Widget build(BuildContext context) {
        return AuthPageLayout(
        child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
                const Text(
                    'Reset Password',
                    style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.darkTeal,
                    ),
                ),
                const SizedBox(height: 8),
                const Text(
                    'Enter your email and we\'ll send you a magic link',
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
                const SizedBox(height: 20),
                ElevatedButton(
                    onPressed: loading ? null : requestReset,
                    style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentTeal,
                    foregroundColor: AppColors.gold,
                    minimumSize: const Size(double.infinity, 48),
                    ),
                    child: Text(loading ? 'Sending...' : 'Send Reset Link'),
                ),
                Text(
                    message,
                    style: const TextStyle(color: AppColors.darkTeal, fontSize: 14),
                    textAlign: TextAlign.center,
                ),
            const SizedBox(height: 16),
                TextButton(
                    onPressed: () {
                        Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                        );
                    },
                    child: const Text(
                        'Rembered your password? Back to Login',
                        style: TextStyle(color: AppColors.accentTeal),
                    ),
                ),
            ],
        ),
        );
  }
}