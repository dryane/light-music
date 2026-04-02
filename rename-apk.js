const fs = require('fs');
const path = require('path');

const appConfig = require('./app.json');
const version = appConfig.expo.version;

const apkDir = path.join(__dirname, 'android/app/build/outputs/apk/release');
const oldPath = path.join(apkDir, 'app-release.apk');
const versionCode = appConfig.expo.android.versionCode;
const newPath = path.join(
  apkDir,
  `light-music-v${version}.apk`
);

if (!fs.existsSync(oldPath)) {
  console.error('APK not found:', oldPath);
  process.exit(1);
}

fs.renameSync(oldPath, newPath);
console.log(`✅ Renamed APK to: ${newPath}`);