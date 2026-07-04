/// Caregiver permission scopes (mirrors `src/lib/care.scopes.ts`).
abstract final class CareScopes {
  static const todayRead = 'today:read';
  static const journalRead = 'journal:read';
  static const medsRead = 'meds:read';
  static const biometricsRead = 'biometrics:read';
  static const biometricsWrite = 'biometrics:write';
  static const seizuresRead = 'seizures:read';
  static const seizuresWrite = 'seizures:write';
  static const reportsRead = 'reports:read';
  static const journalWrite = 'journal:write';
}

enum CareRole { emergency, caregiver, provider, viewer }

const careRoleLabels = <CareRole, String>{
  CareRole.emergency: 'Emergency contact',
  CareRole.caregiver: 'Caregiver / Co-pilot',
  CareRole.provider: 'Care provider',
  CareRole.viewer: 'Viewer',
};

CareRole? parseCareRole(String? raw) {
  if (raw == null) return null;
  for (final role in CareRole.values) {
    if (role.name == raw) return role;
  }
  return null;
}

/// Dashboard tab keys aligned with web `care.$ownerId.tsx`.
enum CareTabKey {
  biometrics,
  today,
  meds,
  hydration,
  journal,
  seizures,
  reports,
  chat,
}

class CareTabDefinition {
  const CareTabDefinition({
    required this.key,
    required this.label,
    required this.scope,
  });

  final CareTabKey key;
  final String label;
  final String scope;
}

const careTabDefinitions = <CareTabDefinition>[
  CareTabDefinition(
    key: CareTabKey.biometrics,
    label: 'Biometrics',
    scope: CareScopes.biometricsRead,
  ),
  CareTabDefinition(
    key: CareTabKey.today,
    label: 'Today',
    scope: CareScopes.todayRead,
  ),
  CareTabDefinition(
    key: CareTabKey.meds,
    label: 'Meds',
    scope: CareScopes.medsRead,
  ),
  CareTabDefinition(
    key: CareTabKey.hydration,
    label: 'Hydration',
    scope: CareScopes.biometricsRead,
  ),
  CareTabDefinition(
    key: CareTabKey.journal,
    label: 'Journal',
    scope: CareScopes.journalRead,
  ),
  CareTabDefinition(
    key: CareTabKey.seizures,
    label: 'Seizures',
    scope: CareScopes.seizuresRead,
  ),
  CareTabDefinition(
    key: CareTabKey.reports,
    label: 'Reports',
    scope: CareScopes.reportsRead,
  ),
  CareTabDefinition(
    key: CareTabKey.chat,
    label: 'Chat',
    scope: CareScopes.todayRead,
  ),
];

String careTabKeyName(CareTabKey key) => key.name;

CareTabKey? careTabKeyFromName(String raw) {
  for (final tab in CareTabKey.values) {
    if (tab.name == raw) return tab;
  }
  return null;
}
