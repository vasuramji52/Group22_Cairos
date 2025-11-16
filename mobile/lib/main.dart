import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'package:mobile/screens/bottom_nav.dart';
import 'package:mobile/screens/register_screen.dart';

// Screens
import 'screens/login_screen.dart';
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

    // 🚀 COLD START: app launched from a link
    try {
      final Uri? initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        _handleIncomingLink(initialUri);
      }
    } catch (e) {
      debugPrint('Error reading initial link: $e');
    }

    // 🔥 WARM STATE: app already open, receives a link
    _appLinks.uriLinkStream.listen(
      (Uri? uri) {
        if (uri != null) {
          _handleIncomingLink(uri);
        }
      },
      onError: (err) {
        debugPrint('Deep link stream error: $err');
      },
    );
  }

  /// 💡 Central place to route deep links
  void _handleIncomingLink(Uri uri) {
    final link = uri.toString();
    debugPrint('🔗 Incoming deep link: $link');

    // ---- EMAIL VERIFICATION ----
    // You’re redirecting to: cairosapp://verified?verified=1
    if (link.contains('verified=1')) {
      setState(() {
        _startScreen = const VerifiedScreen();
      });
      return;
    }

    // ---- RESET PASSWORD ----
    // For example: cairosapp://reset-password?uid=...&token=...
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

    // Fallback if link is unknown → go to login
    setState(() {
      _startScreen = const LoginScreen();
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      initialRoute: '/login',

      // 👇 Named routes for your app
      routes: {
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/forgot': (_) => const ForgotPasswordScreen(),
        '/reset-password': (_) => const ResetPasswordScreen(uid: '', token: ''),

        // Main app navigation after login
        '/dashboard': (_) => const BottomNav(),
      },
    );
  }
}
