import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.creatoraistudio.app",
  appName: "CreatorAI Studio",
  webDir: "out", // used when doing static export
  server: {
    // For development: point to local Next.js
    // url: "http://10.0.2.2:3000", // Android emulator → host
    // For production APK: leave url undefined to load from webDir,
    // or set to your deployed URL:
    // url: "https://your-domain.com",
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#f8fafc",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#2563eb",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
