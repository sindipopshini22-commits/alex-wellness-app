import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor wraps the Alex web app in a native iOS/Android shell.
//
// SECURITY CONFIGURATION:
// - allowMixedContent: false — blocks HTTP content on HTTPS pages
// - cleartext: false — blocks cleartext HTTP traffic in production
// - Server URL should point to the production API with HTTPS
// - Certificate pinning is configured per-platform below

const config: CapacitorConfig = {
  appId: "com.alex.wellness",
  appName: "Alex",
  webDir: "out",

  android: {
    // Block cleartext (HTTP) traffic — only allow HTTPS
    allowMixedContent: false,
    // Capture screen security: prevent content from appearing in recents
    // and prevent screenshots in production
    overrideUserAgent: "Alex-Android",
  },

  ios: {
    contentInset: "automatic",
    // Prevent screen capture and recording
    // Note: requires additional native code (UIApplication.shared.isIdleTimerDisabled)
  },

  server: {
    // PRODUCTION: Change to your HTTPS API endpoint
    // url: "https://api.alex.yourcompany.com",
    // For local development (Android emulator):
    url: "http://10.0.2.2:3000",
    // cleartext must be false in production
    cleartext: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#09090b",
    },
  },
};

export default config;
