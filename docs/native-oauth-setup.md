# Native OAuth deep link setup

Purple native apps (Capacitor) complete Google and Apple sign-in in the system
browser, not the WebView. `src/lib/native/oauth.ts` opens the Supabase OAuth URL
with `skipBrowserRedirect: true`, then finishes when the provider chain redirects
to a custom-scheme deep link.

**Redirect URI (exact):** `org.purplelife.app://auth-callback`

Register this URI in the native projects, Supabase Auth, and (indirectly) the
provider consoles. Google and Apple redirect to Supabase first; Supabase redirects
to the app scheme. Only Supabase needs the custom scheme in its redirect allow
list. Web redirect URLs stay unchanged.

Related: `docs/native-app-setup.md` (Capacitor install), `docs/oauth-provider-setup.md`
(web OAuth providers), `capacitor.config.ts` (`appId: org.purplelife.app`).

---

## 1. iOS: Info.plist CFBundleURLTypes

After `bun run native:add`, edit `ios/App/App/Info.plist`. Add (or merge) a
`CFBundleURLTypes` entry so iOS routes `org.purplelife.app://…` back into the
Capacitor shell:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>org.purplelife.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>org.purplelife.app</string>
    </array>
  </dict>
</array>
```

**Verify:** build to a device or simulator, run `xcrun simctl openurl booted
"org.purplelife.app://auth-callback?code=test"`, confirm the app foregrounds and
Capacitor emits `appUrlOpen`.

**Xcode:** you can also add a URL Type under the app target (Info tab): Identifier
`org.purplelife.app`, URL Schemes `org.purplelife.app`. Xcode writes the same
`CFBundleURLTypes` block.

---

## 2. Android: AndroidManifest.xml intent filter

Edit `android/app/src/main/AndroidManifest.xml`. Inside the main
`<activity android:name=".MainActivity" …>` (the Capacitor activity), add:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data
    android:scheme="org.purplelife.app"
    android:host="auth-callback" />
</intent-filter>
```

Place it alongside the existing `MAIN` / `LAUNCHER` intent filter. Do not remove
the launcher filter.

**Verify:**

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "org.purplelife.app://auth-callback?code=test" org.purplelife.app
```

The app should open and Capacitor should deliver the URL to `appUrlOpen`.

---

## 3. Supabase Auth redirect URL list

Project ref: `xxnzmfzsjplrutrgbzxy`  
Dashboard: https://supabase.com/dashboard/project/xxnzmfzsjplrutrgbzxy/auth/url-configuration

Add to **Redirect URLs** (keep all existing web URLs):

| URL | Purpose |
|-----|---------|
| `org.purplelife.app://auth-callback` | Native Capacitor OAuth completion |
| `https://www.purplelife.org/` | Production web (existing) |
| `http://localhost:8080/` | Local dev (existing, port from `bun run dev`) |
| `https://auth.purplelife.org/auth/v1/callback` | Branded Supabase callback (provider consoles, not this list) |

The native URI must match `NATIVE_REDIRECT` in `src/lib/native/oauth.ts` exactly.
Trailing slashes or different hosts will break PKCE exchange.

**Site URL** can remain `https://www.purplelife.org` (web default). Native sign-in
passes `redirectTo: org.purplelife.app://auth-callback` per request.

---

## 4. Provider consoles (web flow, no native scheme)

Supabase owns the redirect to the app. Provider consoles only need the Supabase
callback URLs documented in `docs/oauth-provider-setup.md`:

- Google **Authorized redirect URIs:** `https://auth.purplelife.org/auth/v1/callback`
  and `https://xxnzmfzsjplrutrgbzxy.supabase.co/auth/v1/callback`
- Apple **Return URLs:** same two Supabase callback URLs

Do **not** add `org.purplelife.app://auth-callback` to Google or Apple; those
providers never redirect to the app directly.

---

## 5. Runtime wiring (already in repo)

| Piece | Location |
|-------|----------|
| OAuth helper | `src/lib/native/oauth.ts` |
| Sign-in buttons | `src/components/auth/social-sign-in-buttons.tsx` calls `nativeSignInWithOAuth` when `isNativeApp()` |
| Capacitor config | `capacitor.config.ts` (`appId: org.purplelife.app`) |
| App plugin | `@capacitor/app` (deep link listener, cold-start launch URL) |
| Browser plugin | `@capacitor/browser` (system browser for consent) |

Call `initNativeOAuthDeepLink()` from `initNativeApp()` in `src/lib/native/index.ts`
so cold-start deep links (app killed during OAuth) are handled before the user
opens sign-in again. Example:

```typescript
import { initNativeOAuthDeepLink } from "./oauth";

export async function initNativeApp(): Promise<void> {
  // …existing setup…
  initNativeOAuthDeepLink();
}
```

---

## 6. End-to-end test

1. Apply iOS and Android snippets above; `bun run native:sync`.
2. Add `org.purplelife.app://auth-callback` in Supabase redirect URLs.
3. Install the debug build on a device (simulator WebView OAuth is unreliable).
4. Open `/sign-in`, tap **Continue with Google** or **Continue with Apple**.
5. Complete consent in the system browser; the app should return foreground,
   browser sheet closes, session is active (Today or Account loads signed in).

**Failure modes**

| Symptom | Check |
|---------|-------|
| Browser completes but app stays signed out | Supabase redirect allow list; Info.plist / intent filter host `auth-callback` |
| App never opens after consent | URL scheme registration; `appId` matches `org.purplelife.app` |
| `oauth callback error` in logs | Provider or Supabase error query params; provider enabled in dashboard |
| Works after sign-in tap, fails on cold start | Call `initNativeOAuthDeepLink()` from `initNativeApp()` |

---

## 7. Patch checklist when native projects exist

```bash
# From repo root after bun run native:add
test -f ios/App/App/Info.plist && echo "patch Info.plist CFBundleURLTypes"
test -f android/app/src/main/AndroidManifest.xml && echo "patch MainActivity intent filter"
bun run native:sync
```

If `ios/` or `android/` are missing, run `bun run native:install` and
`bun run native:add` on a machine with Xcode and Android Studio first.
