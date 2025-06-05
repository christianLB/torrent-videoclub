# Android/Fire TV Build Guide

This guide describes how to create a debug APK for running Torrent VideoClub on Amazon Fire TV devices.

## Building Manually

1. Install project dependencies and build the web assets:

   ```bash
   npm install
   npm run build
   ```

2. Copy the web output into the Android project and assemble the debug APK:

   ```bash
   npx cap copy android && cd android && ./gradlew assembleDebug
   ```

3. The generated APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Using the build-apk script

Instead of running the manual command, you can use the npm script:

```bash
npm run build-apk
```

This performs the `npx cap copy android` and `./gradlew assembleDebug` steps for you and produces the same APK in `android/app/build/outputs/apk/debug/app-debug.apk`.
