// lib/theme.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const darkTeal = Color(0xFF1B4B5A);
  static const accentTeal = Color(0xFF2C6E7E);
  static const gold = Color(0xFFFFD700);
  static const bronze = Color(0xFFD4AF37);
  static const beige = Color.fromARGB(255, 245, 230, 211);

  // Use this as your scaffold background
  static Color get backgroundTeal => const Color(0xFF10242C);
}

class AppTheme {
  static ThemeData get lightTheme => _buildLightTheme();
}

ThemeData _buildLightTheme() {
  final base = ThemeData(
    brightness: Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.darkTeal,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: AppColors.backgroundTeal,
    useMaterial3: true,
  );

  // Nunito as base text for everything
  final nunito = GoogleFonts.nunitoTextTheme(base.textTheme);

  // Override roles: Cinzel for headers, Cormorant for titles/subtitles
  final textTheme = nunito.copyWith(
    // HEADERS → Cinzel
    headlineLarge: GoogleFonts.cinzel(
      textStyle: nunito.headlineLarge,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.4,
    ),
    headlineMedium: GoogleFonts.cinzel(
      textStyle: nunito.headlineMedium,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.3,
    ),
    headlineSmall: GoogleFonts.cinzel(
      textStyle: nunito.headlineSmall,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.2,
    ),

    // ACCENT / SUBTITLES → Cormorant Garamond
    titleLarge: GoogleFonts.cormorantGaramond(
      textStyle: nunito.titleLarge,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.2,
    ),
    titleMedium: GoogleFonts.cormorantGaramond(
      textStyle: nunito.titleMedium,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.2,
    ),
    titleSmall: GoogleFonts.cormorantGaramond(
      textStyle: nunito.titleSmall,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.2,
    ),

    // Bodies + labels stay Nunito from base
  );

  return base.copyWith(
    textTheme: textTheme,

    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.backgroundTeal,
      foregroundColor: AppColors.gold,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: textTheme.headlineSmall?.copyWith(
        color: AppColors.gold,
      ),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.darkTeal,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: textTheme.bodyMedium,
      ),
    ),

    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.darkTeal,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: textTheme.bodyMedium,
      ),
    ),

    // 👇 THIS is the part that was causing your error
    cardTheme: CardThemeData(
      color: AppColors.beige,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      elevation: 2,
      margin: const EdgeInsets.symmetric(vertical: 8),
    ),
  );
}
