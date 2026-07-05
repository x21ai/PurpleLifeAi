import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../design/purple_type.dart';
import '../shared/glass_helpers.dart';

/// Contact form wired to `contact_messages` (web `/contact`).
class ContactScreen extends ConsumerStatefulWidget {
  const ContactScreen({super.key});

  @override
  ConsumerState<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends ConsumerState<ContactScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();

  bool _submitting = false;
  bool _sent = false;

  @override
  void initState() {
    super.initState();
    final session = Supabase.instance.client.auth.currentSession;
    _emailController.text = session?.user.email ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final message = _messageController.text.trim();
    if (name.isEmpty || email.isEmpty || message.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in name, email, and message.')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      await Supabase.instance.client.from('contact_messages').insert({
        'name': name.length > 200 ? name.substring(0, 200) : name,
        'email': email.length > 320 ? email.substring(0, 320) : email,
        'subject': _subjectController.text.trim().isEmpty
            ? null
            : _subjectController.text.trim().length > 200
                ? _subjectController.text.trim().substring(0, 200)
                : _subjectController.text.trim(),
        'message':
            message.length > 5000 ? message.substring(0, 5000) : message,
      });
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _sent = true;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Message sent. We'll be in touch.")),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Couldn't send. Please try again.")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go('/settings'),
                icon: Icon(Icons.arrow_back,
                    color: Colors.white.withValues(alpha: 0.55)),
                label: Text(
                  'Settings',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'CONTACT',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Say hello.',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'A real person reads every message. Usually within a day.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.65),
                      height: 1.5,
                    ),
              ),
              const SizedBox(height: 24),
              if (_sent)
                GlassSurface(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Thank you.',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontFamily: PurpleType.serif,
                              color: Colors.white.withValues(alpha: 0.95),
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "We'll get back to you at ${_emailController.text} as soon as we can.",
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                      ),
                    ],
                  ),
                )
              else
                GlassSurface(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _field('Your name', _nameController),
                      const SizedBox(height: 12),
                      _field('Email', _emailController,
                          keyboard: TextInputType.emailAddress),
                      const SizedBox(height: 12),
                      _field('Subject (optional)', _subjectController),
                      const SizedBox(height: 12),
                      _field('Message', _messageController, maxLines: 6),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _submitting ? null : _submit,
                        child: _submitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Send message'),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController controller, {
    TextInputType? keyboard,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.55),
              ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboard,
          maxLines: maxLines,
          style: TextStyle(color: Colors.white.withValues(alpha: 0.92)),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.04),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  BorderSide(color: Colors.white.withValues(alpha: 0.1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  BorderSide(color: Colors.white.withValues(alpha: 0.25)),
            ),
          ),
        ),
      ],
    );
  }
}
