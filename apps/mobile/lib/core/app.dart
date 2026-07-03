import 'package:flutter/material.dart';

import '../features/splash/presentation/splash_screen.dart';
import 'theme/app_theme.dart';

void runNivaApp() {
  runApp(const NivaApp());
}

class NivaApp extends StatelessWidget {
  const NivaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Niva',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      home: const SplashScreen(),
    );
  }
}
