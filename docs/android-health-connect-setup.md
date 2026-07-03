# Android Health Connect setup

Purple's Android shell reads sleep, HRV, steps, and heart rate through
[Health Connect](https://developer.android.com/health-and-fitness/guides/health-connect)
via the `@capgo/capacitor-health` plugin. The web layer talks to the plugin through
`window.Capacitor.Plugins.Health` (see `src/lib/native/capacitor.ts` and
`src/lib/native/health-android.ts`), so no Capacitor npm package is bundled into
the production web build.

## Requirements

- Android 8.0 (API 26) or later.
- Health Connect installed on the device. Android 14+ ships it by default. On
  Android 8 through 13 the user must install
  [Health Connect by Android](https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata)
  from the Play Store.
- A privacy policy URL or HTML asset (Health Connect requires it in the permission
  flow). Purple's policy lives at `https://www.purplelife.org/privacy`.

## 1. Install the plugin

On a machine with the Android SDK and an `android/` Capacitor project:

```bash
bun add @capgo/capacitor-health
bun run native:sync
```

Match the plugin major version to your Capacitor version (v8 plugin for Capacitor 8).
See `docs/native-app-setup.md` for the full native bootstrap.

## 2. AndroidManifest permissions

Add read permissions for the metrics Purple syncs. Place these inside the
`<manifest>` element of `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.health.READ_SLEEP" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE_VARIABILITY" />
<uses-permission android:name="android.permission.health.READ_STEPS" />
```

The plugin manifest may merge additional declarations. Keep Purple's manifest
aligned with the data types requested in `requestHealthConnectPermissions()` inside
`src/lib/native/health-android.ts`.

### Health Connect activity alias

Health Connect also expects an activity alias so users can manage permissions from
system settings. Add this inside `<application>` (adjust the activity name to match
your main activity):

```xml
<activity-alias
  android:name="ViewPermissionUsageActivity"
  android:exported="true"
  android:targetActivity=".MainActivity"
  android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
  <intent-filter>
    <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
    <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
  </intent-filter>
</activity-alias>
```

## 3. Privacy policy for Health Connect

Option A (hosted URL, recommended):

`android/app/src/main/res/values/strings.xml`

```xml
<string name="health_connect_privacy_policy_url">https://www.purplelife.org/privacy</string>
```

Option B (bundled HTML):

`android/app/src/main/assets/public/privacypolicy.html`

The plugin exposes `Health.showPrivacyPolicy()` if you need to surface it from the
app. The web bridge can call it with `callPlugin("Health", "showPrivacyPolicy")`.

## 4. Gradle and SDK

The plugin targets min SDK 26. Confirm `android/variables.gradle` or
`android/app/build.gradle` does not set `minSdkVersion` below 26.

## 5. Runtime flow in Purple

1. User opens Purple in the Android Capacitor shell (`isNativeApp()` is true).
2. `isNativeHealthAvailable()` calls `Health.isAvailable()` through the bridge.
3. `requestNativeHealthPermissions()` opens the Health Connect permission UI for
   sleep, heart rate, HRV, and steps.
4. `readNativeHealthMetrics()` aggregates samples into daily rows with
   `source: "health_connect"` (sleep total/REM/deep, average HR and HRV, daily
   step sums).
5. An authenticated server function upserts those rows into `biometrics` (same
   daily shape as Apple Health; see `src/lib/apple-health.server.ts`).

Until the server upsert path is wired, the bridge still returns rows locally for
testing with:

```typescript
import { readNativeHealthMetrics } from "@/lib/native/health";

const days = await readNativeHealthMetrics(30);
console.info("[health_connect]", days.length, "days");
```

## 6. Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `available: false`, reason mentions not installed | Install Health Connect from Play Store (Android 8-13). |
| Empty samples after grant | Wearable or phone has not written data to Health Connect yet. |
| Permission sheet never opens | Plugin not synced (`bun run native:sync`) or `Health` plugin missing from the shell. |
| Play Console rejection | Declare health data use in the Data safety form and link the privacy policy. |

## 7. Verify on device

```bash
bun run native:open:android
```

Build and run on a physical device or emulator with Health Connect. In Chrome
remote debugging, confirm `window.Capacitor.Plugins.Health` exists and
`readNativeHealthMetrics(7)` returns rows when sample data is present.

## Related files

- `src/lib/native/health-android.ts`: Health Connect read and daily aggregation.
- `src/lib/native/health.ts`: platform switch (iOS HealthKit + Android Health Connect).
- `src/lib/native/capacitor.ts`: dependency-free Capacitor bridge helpers.
- `docs/native-app-setup.md`: full Capacitor shell checklist.
