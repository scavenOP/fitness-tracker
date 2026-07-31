# 🏃 FitTrack Pro — Angular Fitness Tracker

A super cool, fully animated, mobile-first fitness tracker built with **Angular 17** + **Firebase Realtime Database**.

---

## ✨ Features

- 🔐 **Auth** — Email/password login & signup. Session persists across browser restarts.
- 🗺️ **Live Tracker** — Real-time GPS tracking with Leaflet map (OpenStreetMap, 100% free)
- ⚡ **Real-time Stats** — Speed, avg speed, distance, steps, calories, duration — all live
- 📊 **History** — All past activities with filters (walk/run/week/month)
- 🏅 **Activity Detail** — Full route map, speed bars, achievements
- 📱 **Mobile-first** — Bottom nav, safe-area insets, touch-optimized
- 🎨 **Animations** — Stagger, float, glow, pulse, fade — throughout the app

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Firebase project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (free Spark plan)
3. Enable **Authentication** → Email/Password
4. Enable **Realtime Database** → Start in test mode
5. Copy your config from Project Settings → Your apps → Web app

### 3. Add your Firebase config
Edit `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
  }
};
```

### 4. Set Firebase Database Rules
In Firebase Console → Realtime Database → Rules, paste the contents of `database.rules.json`:
```json
{
  "rules": {
    "activities": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### 5. Run the app
```bash
npm start
```
Open [http://localhost:4200](http://localhost:4200)

---

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/auth` | Login / Signup |
| `/dashboard` | Home with weekly stats & recent activities |
| `/tracker` | Live GPS tracker with map |
| `/history` | All past activities |
| `/activity/:id` | Detailed view of a single activity |

---

## 🗺️ Map
Uses **Leaflet + OpenStreetMap** — completely free, no API key needed.

---

## 🔥 Tech Stack
- Angular 17 (standalone components, signals)
- Firebase Auth + Realtime Database
- Leaflet.js (free maps)
- SCSS with CSS custom properties
- Angular Animations

---

## 📐 Project Structure
```
src/app/
├── core/
│   ├── services/
│   │   ├── auth.service.ts       # Firebase auth
│   │   └── tracking.service.ts   # GPS + calorie + Firebase save
│   └── guards/
│       ├── auth.guard.ts
│       └── guest.guard.ts
└── pages/
    ├── auth/                     # Login/Signup
    ├── dashboard/                # Home
    ├── tracker/                  # Live tracker
    ├── history/                  # Activity list
    └── activity-detail/          # Single activity
```
