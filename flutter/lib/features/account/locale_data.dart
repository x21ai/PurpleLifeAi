/// Curated locale pickers mirrored from web `src/lib/countries.ts` and i18n.
const localeCountries = <MapEntry<String, String>>[
  MapEntry('US', 'United States'),
  MapEntry('CA', 'Canada'),
  MapEntry('GB', 'United Kingdom'),
  MapEntry('AU', 'Australia'),
  MapEntry('NZ', 'New Zealand'),
  MapEntry('IE', 'Ireland'),
  MapEntry('MX', 'Mexico'),
  MapEntry('ES', 'Spain'),
  MapEntry('FR', 'France'),
  MapEntry('DE', 'Germany'),
  MapEntry('IT', 'Italy'),
  MapEntry('PT', 'Portugal'),
  MapEntry('NL', 'Netherlands'),
  MapEntry('IN', 'India'),
  MapEntry('JP', 'Japan'),
  MapEntry('KR', 'South Korea'),
  MapEntry('SG', 'Singapore'),
  MapEntry('BR', 'Brazil'),
  MapEntry('ZA', 'South Africa'),
];

const supportedLocales = <MapEntry<String, String>>[
  MapEntry('en', 'English'),
  MapEntry('es', 'Spanish'),
];

/// Common IANA zones; full list lives on web.
const commonTimezones = <String>[
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

String? countryName(String? code) {
  if (code == null || code.isEmpty) return null;
  final upper = code.toUpperCase();
  for (final entry in localeCountries) {
    if (entry.key == upper) return entry.value;
  }
  return code;
}
