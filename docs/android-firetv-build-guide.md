# Building the Torrent VideoClub Frontend as an Android APK for FireTV

This document describes the steps required to package the Next.js frontend of Torrent VideoClub into an Android application using Capacitor. The resulting APK can be sideloaded on Amazon FireTV devices.

## Prerequisites

- **Node.js** 18 or newer with npm.
- **Java Development Kit (JDK)** 17 or newer.
- **Android Studio** with the Android SDK and platform tools installed.
- **Capacitor CLI** and project dependencies installed via `npm install`.
- A configured `.env.local` file with the required API keys (see `env.template`).

## 1. Build the Web Application

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the production assets:
   ```bash
   npm run build
   ```
3. Export the site for static hosting (Capacitor expects a static directory named `out`):
   ```bash
   npx next export
   ```
   This creates the `out/` directory referenced in `capacitor.config.ts`.

## 2. Initialize and Sync the Android Project

1. If the `android/` folder does not exist, add the platform:
   ```bash
   npx cap add android
   ```
2. Copy the latest web build into the native project:
   ```bash
   npx cap copy android
   ```

## 3. Connect the App to the Backend

This APK uses the API routes from this project as its backend. Ensure the Node.js
server is running and accessible from your FireTV device.

1. Start the backend with `npm start` (after running `npm run build`) or use the
   Docker setup described in `DOCKER-README.md`.
2. Edit `capacitor.config.ts` and set the `server.url` to the base URL of your
   backend, e.g.:
   ```ts
   server: {
     url: 'http://<YOUR_SERVER_IP>:3000',
     cleartext: true
   }
   ```
3. Re-sync the native project after changing the config:
   ```bash
   npx cap copy android
   ```

## 4. Build the APK

1. Navigate to the Android project and build a debug APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.
2. For a release build, configure signing in `android/app/build.gradle` and run `./gradlew assembleRelease`.

## 5. Installing on FireTV

1. Enable developer options and ADB debugging on the FireTV device.
2. Connect via ADB from your computer:
   ```bash
   adb connect <FIRE_TV_IP_ADDRESS>
   ```
3. Install the APK:
   ```bash
   adb install app-debug.apk
   ```

The application should now appear in the FireTV apps menu. Use a remote or game controller to navigate the UI.

## FireTV Specific Considerations

- Ensure the app is optimized for landscape layouts.
- Add a `LEANBACK_LAUNCHER` intent filter in `AndroidManifest.xml` so the app shows on the FireTV home screen.
- Testing on actual FireTV hardware is recommended to verify remote‑control navigation and performance.

