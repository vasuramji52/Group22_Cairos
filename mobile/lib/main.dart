import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'screens/login_screen.dart';
import 'screens/verified_screen.dart';

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
  String? _initialLink;
  Widget _startScreen = const LoginScreen();

  @override
  void initState() {
    super.initState();
    _initDeepLinkHandling();
  }

  Future<void> _initDeepLinkHandling() async {
    _appLinks = AppLinks();

    // Cold start: check if app launched via a link
    final Uri? initialUri = await _appLinks.getInitialLink();
    if (initialUri != null && initialUri.toString().contains('verified=1')) {
      setState(() => _startScreen = const VerifiedScreen());
    }

    // Warm state: listen for link while app is running
    _appLinks.uriLinkStream.listen((Uri? uri) {
      if (uri != null && uri.toString().contains('verified=1')) {
        setState(() => _startScreen = const VerifiedScreen());
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(debugShowCheckedModeBanner: false, home: _startScreen);
  }
}
