import 'package:flutter/material.dart';
import 'app_colors.dart';
import '../../util/dimensions.dart';
import '../../util/styles.dart';

class AppTheme {
  static ThemeData get dark {
    const baseTextTheme = TextTheme(
      bodySmall: robotoRegular,
      bodyMedium: robotoRegular,
      bodyLarge: robotoRegular,
      titleSmall: robotoMedium,
      titleMedium: robotoMedium,
      titleLarge: robotoBold,
      headlineSmall: robotoBold,
      labelMedium: robotoRegular,
      labelLarge: robotoMedium,
    );

    return ThemeData(
      fontFamily: 'Roboto',
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.bgDark,
      colorScheme: const ColorScheme.dark(
        surface: AppColors.surfaceDark,
        primary: AppColors.gradientEnd,
        secondary: AppColors.gradientStart,
        onSurface: AppColors.textPrimaryDark,
        onSurfaceVariant: AppColors.textSecondaryDark,
        outline: AppColors.borderDark,
      ),
      textTheme: baseTextTheme.copyWith(
        bodySmall: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeSmall,
          color: AppColors.textSecondaryDark,
        ),
        bodyMedium: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeDefault,
          color: AppColors.textSecondaryDark,
        ),
        bodyLarge: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeLarge,
          color: AppColors.textPrimaryDark,
        ),
        titleSmall: robotoMedium.copyWith(
          fontSize: Dimensions.fontSizeDefault,
          color: AppColors.textPrimaryDark,
        ),
        titleMedium: robotoMedium.copyWith(
          fontSize: Dimensions.fontSizeLarge,
          color: AppColors.textPrimaryDark,
        ),
        titleLarge: robotoBold.copyWith(
          fontSize: Dimensions.fontSizeExtraLarge,
          color: AppColors.textPrimaryDark,
        ),
        headlineSmall: robotoBold.copyWith(
          fontSize: Dimensions.fontSizeOverLarge,
          color: AppColors.textPrimaryDark,
        ),
        labelMedium: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeSmall,
          color: AppColors.textSecondaryDark,
        ),
        labelLarge: robotoMedium.copyWith(
          fontSize: Dimensions.fontSizeDefault,
          color: AppColors.textPrimaryDark,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceDark,
        contentPadding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeLarge),
        hintStyle: baseTextTheme.bodyLarge?.copyWith(color: AppColors.textSecondaryDark),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 1),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 1),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 1),
          borderSide: BorderSide.none,
        ),
      ),
      iconTheme: const IconThemeData(color: AppColors.textPrimaryDark),
      dividerColor: AppColors.borderDark,
      cardColor: AppColors.cardDark,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.bgDark,
        foregroundColor: AppColors.textPrimaryDark,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: AppColors.cardDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusLarge)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surfaceDark,
        selectedItemColor: AppColors.gradientEnd,
        unselectedItemColor: AppColors.textSecondaryDark,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
    );
  }

  static ThemeData get light {
    const baseTextTheme = TextTheme(
      bodySmall: robotoRegular,
      bodyMedium: robotoRegular,
      bodyLarge: robotoRegular,
      titleSmall: robotoMedium,
      titleMedium: robotoMedium,
      titleLarge: robotoBold,
      headlineSmall: robotoBold,
      labelMedium: robotoRegular,
      labelLarge: robotoMedium,
    );

    return ThemeData(
      fontFamily: 'Roboto',
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.bgLight,
      colorScheme: const ColorScheme.light(
        surface: AppColors.surfaceLight,
        primary: AppColors.gradientEnd,
        secondary: AppColors.gradientStart,
        onSurface: AppColors.textPrimaryLight,
        onSurfaceVariant: AppColors.textSecondaryLight,
        outline: AppColors.borderLight,
      ),
      textTheme: baseTextTheme.copyWith(
        bodySmall: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeSmall,
          color: AppColors.textSecondaryLight,
        ),
        bodyMedium: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeDefault,
          color: AppColors.textSecondaryLight,
        ),
        bodyLarge: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeLarge,
          color: AppColors.textPrimaryLight,
        ),
        titleSmall: robotoMedium.copyWith(
          fontSize: Dimensions.fontSizeDefault,
          color: AppColors.textPrimaryLight,
        ),
        titleMedium: robotoMedium.copyWith(
          fontSize: Dimensions.fontSizeLarge,
          color: AppColors.textPrimaryLight,
        ),
        titleLarge: robotoBold.copyWith(
          fontSize: Dimensions.fontSizeExtraLarge,
          color: AppColors.textPrimaryLight,
        ),
        headlineSmall: robotoBold.copyWith(
          fontSize: Dimensions.fontSizeOverLarge,
          color: AppColors.textPrimaryLight,
        ),
        labelMedium: robotoRegular.copyWith(
          fontSize: Dimensions.fontSizeSmall,
          color: AppColors.textSecondaryLight,
        ),
        labelLarge: robotoMedium.copyWith(
          fontSize: Dimensions.fontSizeDefault,
          color: AppColors.textPrimaryLight,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceLight,
        contentPadding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeLarge),
        hintStyle: baseTextTheme.bodyLarge?.copyWith(color: AppColors.textSecondaryLight),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 1),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 1),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Dimensions.radiusLarge - 1),
          borderSide: BorderSide.none,
        ),
      ),
      iconTheme: const IconThemeData(color: AppColors.textPrimaryLight),
      dividerColor: AppColors.borderLight,
      cardColor: AppColors.cardLight,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.bgLight,
        foregroundColor: AppColors.textPrimaryLight,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: AppColors.cardLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusLarge)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surfaceLight,
        selectedItemColor: AppColors.gradientEnd,
        unselectedItemColor: AppColors.textSecondaryLight,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
    );
  }
}
