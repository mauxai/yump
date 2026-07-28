import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Gradient
  static const Color gradientStart = Color(0xFFFF6B7A);
  static const Color gradientMid = Color(0xFFE066C0);
  static const Color gradientEnd = Color(0xFF9B5CF6);

  // Dark theme
  static const Color bgDark = Color(0xFF0A0A0A);
  static const Color surfaceDark = Color(0xFF1A1A1A);
  static const Color cardDark = Color(0xFF1E1E1E);
  static const Color borderDark = Color(0xFF2C2C2C);
  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textSecondaryDark = Color(0xFF8E8E93);

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
