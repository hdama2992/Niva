import 'package:flutter/material.dart';

abstract final class AppTheme {
  static ThemeData light() {
    final colors = ColorScheme.fromSeed(
      seedColor: const Color(0xFFE76F8C),
      brightness: Brightness.light,
    );

    return ThemeData(
      colorScheme: colors,
      scaffoldBackgroundColor: const Color(0xFFFFF8F8),
      useMaterial3: true,
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colors.primary, width: 2),
        ),
      ),
    );
  }
}
