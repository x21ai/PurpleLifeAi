/// Runtime configuration for Purple Flutter.
///
/// TestFlight defaults to Cloudflare Worker auth (`DATA_BACKEND=cloudflare`).
/// `SUPABASE_URL` is used only when `DATA_BACKEND=supabase`.
class AppConfig {
  const AppConfig({
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    required this.siteUrl,
    required this.workerApiBaseUrl,
    this.dataBackend = dataBackendCloudflare,
  });

  /// Default Supabase custom domain. Not used for Cloudflare sign-in.
  static const defaultSupabaseUrl = 'https://auth.purplelife.org';

  /// Public site and Worker API host.
  static const defaultSiteUrl = 'https://www.purplelife.org';

  static const defaultWorkerApiBaseUrl = '$defaultSiteUrl/api';

  static const dataBackendCloudflare = 'cloudflare';

  static const dataBackendSupabase = 'supabase';

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
    const dataBackend = String.fromEnvironment(
      'DATA_BACKEND',
      defaultValue: dataBackendCloudflare,
    );

    final config = AppConfig(
      supabaseUrl: supabaseUrl,
      supabaseAnonKey: supabaseAnonKey,
      siteUrl: siteUrl,
      workerApiBaseUrl: workerApiBaseUrl,
      dataBackend: dataBackend,
    );
    if (!config.usesCloudflareAuth && supabaseAnonKey.isEmpty) {
      throw StateError(
        'SUPABASE_ANON_KEY is required when DATA_BACKEND=supabase. Pass it via '
        '--dart-define=SUPABASE_ANON_KEY=your_publishable_key',
      );
    }
    return config;
  }

  final String supabaseUrl;
  final String supabaseAnonKey;
  final String siteUrl;
  final String workerApiBaseUrl;
  final String dataBackend;

  /// Worker JWT auth and `/api/data/query`. False only for an explicit
  /// Supabase rollback build.
  bool get usesCloudflareAuth =>
      dataBackend.toLowerCase() != dataBackendSupabase;

  Duration get connectivityPingTimeout => const Duration(milliseconds: 2500);
}
