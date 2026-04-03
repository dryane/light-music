#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = __dirname;
const APP_JSON = path.join(ROOT, "app.json");
const PACKAGE_JSON = path.join(ROOT, "package.json");
const PACKAGE_LOCK = path.join(ROOT, "package-lock.json");
const ANDROID_DIR = path.join(ROOT, "android");

// ─── Read app.json ─────────────────────────────────────────────────────────

const appConfig = JSON.parse(fs.readFileSync(APP_JSON, "utf8"));
const version = appConfig.expo.version;
const versionCode = appConfig.expo.android.versionCode;

if (!version || !versionCode) {
  console.error("❌ Missing version or versionCode in app.json");
  process.exit(1);
}

console.log(`\n🎵 Light Music — Release Build`);
console.log(`   Version:      ${version}`);
console.log(`   Version Code: ${versionCode}\n`);

// ─── Sync version to package.json ──────────────────────────────────────────

const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
if (pkg.version !== version) {
  console.log(`📦 Syncing package.json: ${pkg.version} → ${version}`);
  pkg.version = version;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n");
} else {
  console.log(`📦 package.json already at ${version}`);
}

// ─── Sync version to package-lock.json ─────────────────────────────────────

if (fs.existsSync(PACKAGE_LOCK)) {
  const lock = JSON.parse(fs.readFileSync(PACKAGE_LOCK, "utf8"));
  let lockUpdated = false;

  if (lock.version !== version) {
    lock.version = version;
    lockUpdated = true;
  }

  const rootPkg = lock.packages && lock.packages[""];
  if (rootPkg && rootPkg.version !== version) {
    rootPkg.version = version;
    lockUpdated = true;
  }

  if (lockUpdated) {
    console.log(`🔒 Syncing package-lock.json to ${version}`);
    fs.writeFileSync(PACKAGE_LOCK, JSON.stringify(lock, null, 2) + "\n");
  } else {
    console.log(`🔒 package-lock.json already at ${version}`);
  }
}

// ─── Remove android folder ──────────────────────────────────────────────────

if (fs.existsSync(ANDROID_DIR)) {
  console.log(`\n🗑️  Removing android/ for clean version sync...`);
  fs.rmSync(ANDROID_DIR, { recursive: true, force: true });
  console.log(`   Done.`);
}

// ─── Build ──────────────────────────────────────────────────────────────────

console.log(`\n🔨 Building release APK...\n`);
try {
  execSync("npx expo run:android --variant release", {
    stdio: "inherit",
    cwd: ROOT,
  });
} catch {
  console.error("\n❌ Build failed.");
  process.exit(1);
}

// ─── Rename APK ─────────────────────────────────────────────────────────────

const apkDir = path.join(ROOT, "android/app/build/outputs/apk/release");
const oldPath = path.join(apkDir, "app-release.apk");
const newName = `light-music-v${version}.apk`;
const newPath = path.join(apkDir, newName);

if (!fs.existsSync(oldPath)) {
  console.error("❌ APK not found at:", oldPath);
  process.exit(1);
}

fs.copyFileSync(oldPath, newPath);

console.log(`\n✅ Build complete!`);
console.log(`   APK: android/app/build/outputs/apk/release/${newName}\n`);
