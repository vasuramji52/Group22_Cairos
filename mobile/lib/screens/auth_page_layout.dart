import 'package:flutter/material.dart';
import '../theme.dart';
import 'package:lucide_icons/lucide_icons.dart'; // add lucide_icons in pubspec.yaml

class AuthPageLayout extends StatelessWidget {
  final Widget child;
  final String tagline;

  const AuthPageLayout({
    super.key,
    required this.child,
    this.tagline = 'Discover the perfect moments to connect',
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkTeal,
      body: Stack(
        children: [
          // Background texture
          Positioned.fill(
            child: Opacity(
              opacity: 0.05,
              child: Image.network(
                'https://images.unsplash.com/photo-1738512164098-9487d6d501e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
                fit: BoxFit.cover,
              ),
            ),
          ),

          // Page content
          Column(
            children: [
              // Top nav
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: AppColors.gold, width: 3),
                  ),
                  gradient: LinearGradient(
                    colors: [
                      AppColors.darkTeal,
                      AppColors.darkTeal.withOpacity(0.8),
                      Colors.black.withOpacity(0.2),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Logo + title
                    Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.gold,
                          ),
                          child: const Icon(
                            LucideIcons.clock,
                            color: AppColors.darkTeal,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'CAIROS',
                              style: TextStyle(
                                color: AppColors.gold,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2,
                              ),
                            ),
                            Text(
                              'Find your moment',
                              style: TextStyle(
                                color: AppColors.bronze,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    // Links
                    Row(
                      children: const [
                        NavText(label: 'About'),
                        SizedBox(width: 20),
                        NavText(label: 'Features'),
                        SizedBox(width: 20),
                        NavText(label: 'Contact'),
                      ],
                    ),
                  ],
                ),
              ),

              // Centered content
              Expanded(
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Sun–Moon divider
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(LucideIcons.sun, color: AppColors.gold, size: 20),
                            const SizedBox(width: 6),
                            ...List.generate(
                              5,
                              (i) => Container(
                                margin: const EdgeInsets.symmetric(horizontal: 2),
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: AppColors.gold.withOpacity(0.3),
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(LucideIcons.moon, color: AppColors.gold, size: 20),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Gold-bordered card
                        Container(
                          width: 360,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.gold, width: 3),
                            image: const DecorationImage(
                              image: NetworkImage(
                                'https://images.unsplash.com/photo-1686806372785-fcfe9efa9b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
                              ),
                              fit: BoxFit.cover,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.4),
                                blurRadius: 8,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Container(
                            color: Colors.white.withOpacity(0.0),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: child,
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        Text(
                          tagline,
                          style: const TextStyle(
                            color: AppColors.bronze,
                            fontStyle: FontStyle.italic,
                            fontSize: 13,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class NavText extends StatelessWidget {
  final String label;
  const NavText({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        color: AppColors.bronze,
        fontSize: 14,
      ),
    );
  }
}
