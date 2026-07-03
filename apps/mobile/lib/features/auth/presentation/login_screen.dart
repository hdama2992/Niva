import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'otp_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  void _continueToOtp() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => OtpScreen(phone: _phoneController.text.trim()),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),
                Icon(
                  Icons.people_alt_rounded,
                  color: Theme.of(context).colorScheme.primary,
                  size: 56,
                ),
                const SizedBox(height: 24),
                Text(
                  'Find your people.',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Enter your phone number to begin.',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9+]'))],
                  decoration: const InputDecoration(
                    labelText: 'Phone number',
                    hintText: '+91 98765 43210',
                  ),
                  validator: (value) {
                    if (value == null || value.trim().length < 8) {
                      return 'Enter a valid phone number with country code.';
                    }

                    return null;
                  },
                ),
                const SizedBox(height: 16),
                Text(
                  'We will send a one-time verification code.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _continueToOtp,
                    child: const Text('Continue'),
                  ),
                ),
                const Spacer(flex: 2),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
