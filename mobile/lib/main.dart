import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'package:mobile/screens/bottom_nav.dart';

import 'theme.dart'; // 👈 ADD THIS

// Screens
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/verified_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/reset_password_screen.dart';
import 'screens/splash_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final AppLinks _appLinks;
  Uri? _pendingInitialLink;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  Future<void> _initDeepLinks() async {
    _appLinks = AppLinks();

    // COLD START
    try {
      final Uri? initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        _pendingInitialLink = initialUri;
      }
    } catch (e) {
      debugPrint('Error getting initial link: $e');
    }

    // WARM STATE
    _appLinks.uriLinkStream.listen((uri) {
      if (uri != null) {
        _handleWarmLink(uri);
      }
    }, onError: (err) => debugPrint('Deep link stream error: $err'));
  }

  void _handleWarmLink(Uri uri) {
    final link = uri.toString();
    debugPrint("🔥 Warm deep link: $link");

    if (link.contains('verified=1')) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const VerifiedScreen()),
      );
      return;
    }

    if (link.contains('reset')) {
      final uid = uri.queryParameters['uid'];
      final token = uri.queryParameters['token'];

      if (uid != null && token != null) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ResetPasswordScreen(uid: uid, token: token),
          ),
        );
      }
    }
  }

  void handleSplashFinished(BuildContext context) async {
    if (_pendingInitialLink != null) {
      final uri = _pendingInitialLink!;
      final link = uri.toString();

      debugPrint("🔗 Handling pending deep link after splash: $link");

      if (link.contains('verified=1')) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const VerifiedScreen()),
        );
        return;
      }

      if (link.contains('reset')) {
        final uid = uri.queryParameters['uid'];
        final token = uri.queryParameters['token'];

        if (uid != null && token != null) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => ResetPasswordScreen(uid: uid, token: token),
            ),
          );
          return;
        }
      }
    }

    // No deep link → go to login or dashboard depending on token
    final token = await ApiService.getToken();
    if (token != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const BottomNav()),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,

      theme: AppTheme.lightTheme, // 👈 USE THE NEW THEME

      home: Builder(
        builder: (context) {
          return SplashScreen(onFinish: () => handleSplashFinished(context));
        },
      ),

      routes: {
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/forgot': (_) => const ForgotPasswordScreen(),
        '/dashboard': (_) => const BottomNav(),
      },
    );
  }
}
