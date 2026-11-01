import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Gradient
  static const Color gradientStart = Color(0xFFFF6B7A);
  static const Color gradientMid = Color(0xFFE066C0);
  static const Color gradientEnd = Color(0xFF9B5CF6);

  // Dark theme - Modern OLED Glass Palette
  static const Color bgDark = Color(0xFF090A0F);
  static const Color surfaceDark = Color(0xFF13141C);
  static const Color cardDark = Color(0xFF181A26);
  static const Color borderDark = Color(0xFF26283B);
  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textSecondaryDark = Color(0xFF9496A1);
  static const Color glassOverlayDark = Color(0xB313141C);
  static const Color glassBorder = Color(0x22FFFFFF);
  static const Color glowPurple = Color(0x339B5CF6);
  static const Color glowPink = Color(0x33FF6B7A);

  // Light theme
  static const Color bgLight = Color(0xFFF5F5F5);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color cardLight = Color(0xFFF0F0F0);
  static const Color borderLight = Color(0xFFE0E0E0);
  static const Color textPrimaryLight = Color(0xFF0A0A0A);
  static const Color textSecondaryLight = Color(0xFF6B6B6B);

  // Special
  static const Color tealAccent = Color(0xFF0FD9B5);
  static const Color purpleAccent = Color(0xFF6B3FA0);
  static const Color redDot = Color(0xFFFF3B30);
  static const Color freeBadge = Color(0xFF3A2D5C);

  static const Gradient mainGradient = LinearGradient(
    colors: [gradientStart, gradientEnd],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
}
