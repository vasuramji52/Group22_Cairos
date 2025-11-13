import 'package:flutter/material.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'package:google_fonts/google_fonts.dart';

class VerifiedScreen extends StatefulWidget {
  const VerifiedScreen({super.key});

  @override
  State<VerifiedScreen> createState() => _VerifiedScreenState();
}

class _VerifiedScreenState extends State<VerifiedScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeIn;

  @override
  void initState() {
    super.initState();

    // Fade-in animation controller
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _fadeIn = CurvedAnimation(parent: _controller, curve: Curves.easeOut);

    _controller.forward();

    // Redirect to login after 2 seconds
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundTeal,
      body: Center(
        child: FadeTransition(
          opacity: _fadeIn,
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 32),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.95),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.verified_rounded,
                  color: AppColors.accentTeal,
                  size: 72,
                ),
                const SizedBox(height: 16),
                Text(
                  'Email Verified!',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.darkTeal,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your account is now active.\nRedirecting to login...',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    color: AppColors.darkTeal.withOpacity(0.8),
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 24),
                const LinearProgressIndicator(
                  backgroundColor: Color(0xFFD9C06A),
                  color: Color(0xFF2C6E7E),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
