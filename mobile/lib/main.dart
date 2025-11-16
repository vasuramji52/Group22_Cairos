import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'package:mobile/screens/bottom_nav.dart';

// Screens
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/verified_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/reset_password_screen.dart';

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
  Widget _startScreen = const LoginScreen();

  @override
  void initState() {
    super.initState();
    _initDeepLinkHandling();
  }

  Future<void> _initDeepLinkHandling() async {
    _appLinks = AppLinks();

    // -------- COLD START --------
    try {
      final Uri? initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        _handleIncomingLink(initialUri);
      }
    } catch (e) {
      debugPrint('Error reading initial link: $e');
    }

    // -------- WARM STATE --------
    _appLinks.uriLinkStream.listen(
      (Uri? uri) {
        if (uri != null) {
          _navigateFromDeepLink(uri);
        }
      },
      onError: (err) {
        debugPrint('Deep link stream error: $err');
      },
    );
  }

  /// Deep link handler for COLD start
  void _handleIncomingLink(Uri uri) {
    final link = uri.toString();
    debugPrint('🔗 Cold-start deep link: $link');

    if (link.contains('verified=1')) {
      setState(() => _startScreen = const VerifiedScreen());
      return;
    }

    if (link.contains('reset')) {
      final uid = uri.queryParameters['uid'];
      final token = uri.queryParameters['token'];

      if (uid != null && token != null) {
        setState(() {
          _startScreen = ResetPasswordScreen(uid: uid, token: token);
        });
      }
      return;
    }
  }

  /// Deep link handler while app is running
  void _navigateFromDeepLink(Uri uri) {
    final link = uri.toString();
    debugPrint('🔥 Warm-state deep link: $link');

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
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,

      // IMPORTANT: Use _startScreen instead of initialRoute
      home: _startScreen,

      routes: {
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/forgot': (_) => const ForgotPasswordScreen(),
        '/reset-password': (_) => const ResetPasswordScreen(uid: '', token: ''),
        '/dashboard': (_) => const BottomNav(),
      },
    );
  }
}
