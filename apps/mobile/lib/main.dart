import 'package:flutter/material.dart';

void main() {
  runApp(const NivaApp());
}

class NivaApp extends StatelessWidget {
  const NivaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Niva',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE76F8C),
        ),
        useMaterial3: true,
      ),
      home: const NivaHomePage(),
    );
  }
}

class NivaHomePage extends StatelessWidget {
  const NivaHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.favorite_rounded, size: 72, color: colors.primary),
                const SizedBox(height: 24),
                Text(
                  'Niva',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Meaningful friendships start with showing up.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 32),
                FilledButton(
                  onPressed: () {},
                  child: const Text('Find your people'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
