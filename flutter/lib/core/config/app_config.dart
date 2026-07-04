/// Runtime configuration for Purple Flutter.
///
/// Secrets are never hardcoded. Pass publishable keys via `--dart-define`:
/// `--dart-define=SUPABASE_ANON_KEY=...`
class AppConfig {
  const AppConfig({
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    required this.siteUrl,
    required this.workerApiBaseUrl,
  });

  /// Default Supabase custom domain (matches production web).
  static const defaultSupabaseUrl = 'https://auth.purplelife.org';

  /// Public site and Worker API host.
  static const defaultSiteUrl = 'https://www.purplelife.org';

  static const defaultWorkerApiBaseUrl = '$defaultSiteUrl/api';

  /// Build from compile-time `--dart-define` overrides.
  factory AppConfig.fromEnvironment() {
    const supabaseUrl = String.fromEnvironment(
      'SUPABASE_URL',
      defaultValue: defaultSupabaseUrl,
    );
    const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
    const siteUrl = String.fromEnvironment(
      'SITE_URL',
      defaultValue: defaultSiteUrl,
    );
    const workerApiBaseUrl = String.fromEnvironment(
      'WORKER_API_BASE_URL',
      defaultValue: defaultWorkerApiBaseUrl,
    );

    if (supabaseAnonKey.isEmpty) {
      throw StateError(
        'SUPABASE_ANON_KEY is required. Pass it via '
        '--dart-define=SUPABASE_ANON_KEY=your_publishable_key',
      );
    }

    return const AppConfig(
      supabaseUrl: supabaseUrl,
      supabaseAnonKey: supabaseAnonKey,
      siteUrl: siteUrl,
      workerApiBaseUrl: workerApiBaseUrl,
    );
  }

  final String supabaseUrl;
  final String supabaseAnonKey;
  final String siteUrl;
  final String workerApiBaseUrl;

  Duration get connectivityPingTimeout => const Duration(milliseconds: 2500);
}
