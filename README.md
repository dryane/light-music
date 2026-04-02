# Light Music

A minimal, intentional music player for the [Light Phone 3](https://www.thelightphone.com/), built with React Native and Expo. Designed to match the Light Phone's philosophy — no clutter, no distractions, just your music.

---

## Features

- **Local library scanning** — reads your music files directly from the device, no streaming required
- **ID3 metadata** — artist, album, track number, year extracted from MP3, M4A, FLAC and more
- **Album artwork** — fetched from [MusicBrainz Cover Art Archive](https://coverartarchive.org/) with embedded art as fallback
- **Background playback** — music keeps playing when the screen is off or the app is backgrounded
- **Lock screen & notification controls** — play, pause, skip from the lock screen, notification drawer, and Bluetooth devices
- **Gesture navigation** — swipe right to go back, swipe down to dismiss Now Playing — no back buttons
- **Incremental scanning** — only re-reads files that have changed since last scan
- **AMOLED black** — pure #000000 UI designed for OLED screens

---

## Screenshots

> Coming soon

---

## Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 |
| Navigation | Expo Router |
| Audio | react-native-track-player 4.1.1 |
| Metadata | music-metadata |
| Media library | expo-media-library |
| Icons | @expo/vector-icons (FontAwesome5) |
| Haptics | expo-haptics |

---

## Building

### Prerequisites

- Node 20+
- Android Studio with Android SDK
- A physical Android device or emulator

### Install

```bash
git clone https://github.com/dryane/light-music.git
cd light-music
npm install --legacy-peer-deps
```

### Run on device

```bash
npx expo run:android
```

### Release build

```bash
npm run build:android
```

The APK will be output to `android/app/build/outputs/apk/release/`.

---

## Pushing music to the device

```bash
# Push music files
adb push ~/Music/. /storage/emulated/0/Music/

# Trigger media scan
adb shell "content call --uri content://media --method scan_volume --arg external"

# Clear app cache to force rescan
adb shell pm clear com.vandam.lightmusic
```

---

## Notes

- Built specifically for the Light Phone 3 (1080×1240 AMOLED, Android). May work on other Android devices but is not tested on them.
- The Light Phone dashboard converts music to 256kbps and strips embedded album art — this is why the app defaults to fetching art from MusicBrainz.
- `react-native-track-player@4.1.1` requires a patch for React Native 0.81 compatibility. The patch is included in `patches/` and applied automatically via `postinstall`.
- New Architecture is disabled (`newArchEnabled=false`) due to RNTP 4.1.1 not yet supporting it.

---

## License

MIT
