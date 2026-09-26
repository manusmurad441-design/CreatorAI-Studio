# Building the CreatorAI Studio Android APK

## Prerequisites (on your machine)

1. **Node.js 20+**
2. **Android Studio** (or Android SDK command-line tools)
3. **JDK 17 or 21**
4. Environment variables:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
   ```

## One-time setup

```bash
cd creator-ai-studio
npm install
npx cap add android          # if android/ folder does not exist yet
npx cap sync
```

## Development (APK loads local or remote web app)

### Option A – Point APK at deployed website (recommended for real usage)

1. Deploy the Next.js app (Vercel / your server).
2. Edit `capacitor.config.ts`:
   ```ts
   server: {
     url: "https://your-app.vercel.app",
     androidScheme: "https",
   }
   ```
3. Sync and build:
   ```bash
   npx cap sync android
   npx cap open android
   ```
4. In Android Studio → Build → Build Bundle(s) / APK(s) → Build APK(s)

### Option B – Local debug APK

```bash
npm run build          # or npm run dev in another terminal
npx cap sync android
cd android
./gradlew assembleDebug
```

APK location:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Release (signed) APK

1. Generate a keystore (once):
   ```bash
   keytool -genkey -v -keystore creatorai-release.keystore -alias creatorai -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Create `android/key.properties`:
   ```
   storePassword=YOUR_STORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=creatorai
   storeFile=../creatorai-release.keystore
   ```

3. Build:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

Release APK:
```
android/app/build/outputs/apk/release/app-release.apk
```

## App ID

- Package: `com.creatoraistudio.app`
- Name: CreatorAI Studio

## Notes

- Auth, video upload, Gemini analysis and Stripe all run through the web app / API routes.
- For production, deploy Next.js first, then set `server.url` to that domain so the APK is a native shell around the live product.
- Google Play requires a signed AAB (`./gradlew bundleRelease`) rather than a plain APK.
