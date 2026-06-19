import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor hybrid shell config for the iOS and Android apps.
 *
 * Purple is SSR on Cloudflare, so the native model is a thin Capacitor shell
 * whose WebView loads the production site directly (server.url). Plugins are
 * surfaced into that remote page through the runtime-injected `window.Capacitor`
 * bridge, which is what src/lib/native/* talks to (no @capacitor npm imports are
 * pulled into the web bundle, so the live web build is untouched).
 *
 * To finish the native track on a machine with Xcode / Android Studio:
 *   bun add -d @capacitor/cli
 *   bun add @capacitor/core @capacitor/ios @capacitor/android \
 *     @capacitor/status-bar @capacitor/splash-screen @capacitor/app \
 *     @capacitor/browser @capacitor/push-notifications @capacitor/local-notifications
 *   bunx cap add ios && bunx cap add android
 *   bunx cap sync
 * See docs/native-app-setup.md for signing, accounts, and store submission.
 */
const config: CapacitorConfig = {
  appId: "org.purplelife.app",
  appName: "Purple",
  // The web assets dir is only used for a fallback bundled shell; in normal
  // operation the WebView loads server.url (production) so the app always
  // tracks the deployed site.
  webDir: "dist/client",
  server: {
    url: "https://www.purplelife.org",
    hostname: "www.purplelife.org",
    androidScheme: "https",
    iosScheme: "https",
  },
  ios: {
    // Let web content draw under the status bar; safe-area insets in CSS
    // (viewport-fit=cover) handle the notch.
    contentInset: "never",
    backgroundColor: "#0a0710",
  },
  android: {
    backgroundColor: "#0a0710",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#0a0710",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
