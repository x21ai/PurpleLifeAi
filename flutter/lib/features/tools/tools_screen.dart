import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_theme.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';

/// Tools and device connections (mirrors web `tools.tsx`).
class ToolsScreen extends StatefulWidget {
  const ToolsScreen({super.key});

  @override
  State<ToolsScreen> createState() => _ToolsScreenState();
}

class _ToolsScreenState extends State<ToolsScreen> {
  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ShellContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Tools',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontFamily: 'Georgia',
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 20),
              const _DeviceCard(
                id: 'device-oura',
                icon: Icons.watch_outlined,
                title: 'Oura Ring',
                subtitle: 'Sleep, readiness, HRV',
                status: 'Not connected',
              ),
              const SizedBox(height: 12),
              const _DeviceCard(
                id: 'device-whoop',
                icon: Icons.favorite_outline,
                title: 'Whoop',
                subtitle: 'Recovery, strain, sleep',
                status: 'Not connected',
              ),
              const SizedBox(height: 12),
              const _DeviceCard(
                id: 'device-apple-health',
                icon: Icons.health_and_safety_outlined,
                title: 'Apple Health',
                subtitle: 'Steps, heart rate, workouts',
                status: 'Not connected',
              ),
              const SizedBox(height: 12),
              GlassCard(
                onTap: _showDevicePicker,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                child: Row(
                  children: [
                    Icon(Icons.add, color: Colors.white.withValues(alpha: 0.85)),
                    const SizedBox(width: 12),
                    Text(
                      'Set up a new device',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const _SectionLabel('Notifications'),
              const _SheetCard(
                child: _PlaceholderRow(
                  title: 'Phone alarms & notifications',
                  subtitle: 'Medication reminders and alert preferences',
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Tools & utilities'),
              _SheetCard(
                child: Column(
                  children: [
                    _ToolRow(
                      icon: Icons.medication_outlined,
                      title: 'Medications',
                      subtitle: 'Schedules, reminders, adherence',
                      onTap: () => context.go(AppRoutes.meds),
                    ),
                    _Divider(),
                    _ToolRow(
                      icon: Icons.description_outlined,
                      title: 'Lab reports',
                      subtitle: 'Upload PDFs or photos. See trends.',
                      onTap: () {},
                    ),
                    _Divider(),
                    _ToolRow(
                      icon: Icons.flight_takeoff,
                      title: 'Travel mode',
                      subtitle: 'Plan trips, anchor doses to home time',
                      onTap: () {},
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Wear and care'),
              _SheetCard(
                child: Column(
                  children: [
                    _ToolRow(
                      icon: Icons.psychology_outlined,
                      title: 'How Purple thinks',
                      subtitle: 'AI patterns and privacy',
                      onTap: () {},
                    ),
                    _Divider(),
                    _ToolRow(
                      icon: Icons.shield_outlined,
                      title: 'Privacy & data',
                      subtitle: 'What we store and why',
                      onTap: () {},
                    ),
                    _Divider(),
                    _ToolRow(
                      icon: Icons.info_outline,
                      title: 'About Purple',
                      subtitle: 'Mission and support',
                      onTap: () {},
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

  Future<void> _showDevicePicker() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF1A1224),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Set up a new device',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Choose a device or app to connect. Purple supports these today.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
                const SizedBox(height: 16),
                _PickerRow(
                  icon: Icons.watch_outlined,
                  title: 'Oura Ring',
                  subtitle: 'Sleep, readiness, HRV',
                  onTap: () => Navigator.pop(context),
                ),
                const SizedBox(height: 8),
                _PickerRow(
                  icon: Icons.favorite_outline,
                  title: 'Whoop',
                  subtitle: 'Recovery, strain, sleep',
                  onTap: () => Navigator.pop(context),
                ),
                const SizedBox(height: 8),
                _PickerRow(
                  icon: Icons.health_and_safety_outlined,
                  title: 'Apple Health',
                  subtitle: 'Steps, heart rate, workouts',
                  onTap: () => Navigator.pop(context),
                ),
                const SizedBox(height: 12),
                Text(
                  'More devices are on the way. Email hello@purplelife.org to request one.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _DeviceCard extends StatelessWidget {
  const _DeviceCard({
    required this.id,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.status,
  });

  final String id;
  final IconData icon;
  final String title;
  final String subtitle;
  final String status;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white.withValues(alpha: 0.85)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  status,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () {},
            child: const Text('Connect'),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              letterSpacing: 1.1,
              color: Colors.white.withValues(alpha: 0.45),
            ),
      ),
    );
  }
}

class _SheetCard extends StatelessWidget {
  const _SheetCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.zero,
      child: child,
    );
  }
}

class _PlaceholderRow extends StatelessWidget {
  const _PlaceholderRow({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
        ],
      ),
    );
  }
}

class _ToolRow extends StatelessWidget {
  const _ToolRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.08),
                ),
                child: Icon(icon, size: 18, color: Colors.white.withValues(alpha: 0.8)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: Colors.white.withValues(alpha: 0.4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Divider(
      height: 1,
      color: Colors.white.withValues(alpha: 0.08),
    );
  }
}

class _PickerRow extends StatelessWidget {
  const _PickerRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      borderRadius: 16,
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: Colors.white.withValues(alpha: 0.85)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                ),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: Colors.white.withValues(alpha: 0.4)),
        ],
      ),
    );
  }
}
