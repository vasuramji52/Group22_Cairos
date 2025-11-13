import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'auth_page_layout.dart';
import 'login_screen.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String uid;
  final String token;

  const ResetPasswordScreen({
    super.key,
    required this.uid,
    required this.token,
  });

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final newPasswordController = TextEditingController();

  bool loading = false;
  String message = "";

  void submitNewPassword() async {
    setState(() => loading = true);

    final response = await ApiService.confirmResetPassword(
      widget.uid,
      widget.token,
      newPasswordController.text,
    );

    if (response.statusCode == 200) {
      setState(() => message = "Password updated! Redirecting to login...");
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    } else {
      setState(() => message = "Failed to update password.");
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
            "Set New Password",
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.darkTeal,
            ),
          ),
          const SizedBox(height: 16),

          TextField(
            controller: newPasswordController,
            obscureText: true,
            decoration: InputDecoration(
              labelText: 'New Password',
              filled: true,
              fillColor: Colors.white.withOpacity(0.8),
              border: const OutlineInputBorder(),
            ),
          ),

          const SizedBox(height: 20),

          ElevatedButton(
            onPressed: loading ? null : submitNewPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accentTeal,
              foregroundColor: AppColors.gold,
              minimumSize: const Size(double.infinity, 48),
            ),
            child: Text(loading ? "Saving..." : "Save New Password"),
          ),

          const SizedBox(height: 12),

          Text(
            message,
            style: const TextStyle(color: AppColors.darkTeal, fontSize: 14),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
