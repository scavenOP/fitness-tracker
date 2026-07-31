# 📱 FitTrack Pro — Mobile App (Ionic/Capacitor + Angular)

Same UI and functionality as the web app, packaged as a **native iOS & Android app** using **Capacitor**.

---

## 🗂 Folder Structure

```
fitness tracker/
├── src/                  ← Original Angular web app (untouched)
└── mobile-app/           ← This Capacitor mobile app
    ├── src/app/          ← Same Angular pages/services
    ├── android/          ← Android native project (after cap add android)
    ├── ios/              ← iOS native project (after cap add ios)
    └── capacitor.config.ts
```

---

## ✨ Mobile-specific Features

| Feature | Android | iOS |
|---------|---------|-----|
| Background GPS tracking | ✅ Foreground Service | ✅ Background Location mode |
| Live notification (updates every 5s) | ✅ Persistent notification with stats | ✅ Persistent banner with stats |
| Dynamic Island / Live Activity | ❌ N/A | ⚠️ Requires Widget Extension (see ios/Info.plist.additions.xml) |
| Screen-off tracking | ✅ | ✅ |
| Native location permission dialog | ✅ | ✅ |

---

## 🚀 Setup & Run

### Prerequisites

```bash
# Install Node.js 18+ then:
npm install -g @angular/cli @capacitor/cli
```

### Step 1 — Install dependencies

```bash
cd "fitness tracker/mobile-app"
npm install
```

### Step 2 — Build the Angular app

```bash
npm run build
```

---

## 🤖 Run on Android (FREE — no Apple account needed)

### Requirements
- [Android Studio](https://developer.android.com/studio) installed
- Android SDK installed (Android Studio installs it automatically)

### Steps

```bash
# 1. Add Android platform (first time only)
npx cap add android

# 2. Copy the AndroidManifest.xml permissions
#    Open android/app/src/main/AndroidManifest.xml
#    and merge the contents from mobile-app/android/app/src/main/AndroidManifest.xml

# 3. Sync web build to native
npm run sync:android

# 4. Open in Android Studio
npm run open:android
```

In Android Studio:
- Connect your Android phone via USB (enable Developer Options + USB Debugging)
- OR use the built-in emulator (AVD Manager → Create Virtual Device)
- Press the ▶ Run button

> **Free**: No Google Play account needed to run on your own device or emulator.

---

## 🍎 Run on iPhone (FREE with Xcode)

### Requirements
- **macOS** with [Xcode 15+](https://developer.apple.com/xcode/) installed
- Free Apple ID (no paid developer account needed for personal device testing)

### Steps

```bash
# 1. Add iOS platform (first time only, run on macOS)
npx cap add ios

# 2. Merge Info.plist additions
#    Open ios/App/App/Info.plist in Xcode
#    Add all keys from mobile-app/ios/Info.plist.additions.xml

# 3. Sync web build to native
npm run sync:ios

# 4. Open in Xcode
npm run open:ios
```

In Xcode:
1. Select the `App` target → Signing & Capabilities
2. Sign in with your **free Apple ID** (Team: Personal Team)
3. Change Bundle Identifier to something unique e.g. `com.yourname.fittrackpro`
4. Connect your iPhone via USB
5. Trust the developer certificate on your iPhone: Settings → General → VPN & Device Management
6. Press ▶ Run

> **Free**: Personal team allows running on your own device for 7 days (re-sign to renew).  
> For unlimited installs, a $99/year Apple Developer account is needed.

---

## 🔄 Workflow (after initial setup)

```bash
# Make code changes, then:
npm run sync:android   # build + sync to Android
npm run sync:ios       # build + sync to iOS

# Then press Run in Android Studio / Xcode
```

---

## 📍 Background Tracking Details

### Android
- Uses `@capacitor-community/background-geolocation` which runs a **Foreground Service**
- A persistent notification appears in the status bar while tracking (required by Android)
- The notification updates every 5 seconds with: time ⏱ · distance 📍 · calories 🔥 · steps 👟
- Works with screen off ✅

### iOS
- Uses `@capacitor-community/background-geolocation` with `UIBackgroundModes: location`
- A persistent notification banner updates every 5 seconds with live stats
- Works with screen off ✅
- For **Dynamic Island Live Activity**: requires a Widget Extension in Xcode (see `ios/Info.plist.additions.xml` for instructions)

---

## 🔥 Firebase
Same Firebase project as the web app — no changes needed.

---

## 🗺️ Map
Leaflet + OpenStreetMap runs inside the Capacitor WebView — completely free, no API key.
