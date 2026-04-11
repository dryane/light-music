/**
 * Album art filesystem cache.
 *
 * Art files are stored as <cacheDir>/album-art/<safeKey>.[jpg|png].
 * A secondary AsyncStorage index (ART_CACHE_KEY) maps albumId → file path
 * so the library can be rebuilt from disk without re-fetching.
 */

import {
  writeAsStringAsync,
  getInfoAsync,
  makeDirectoryAsync,
  cacheDirectory,
} from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { safeFileKey } from "@/utils/stringUtils";
import { Track } from "@/types/music";

const ART_CACHE_KEY = "library_art_cache_v7";
const ART_DIR = (cacheDirectory ?? "") + "album-art/";

// ─── Directory ───────────────────────────────────────────────────────────────

export async function ensureArtDir(): Promise<void> {
  try {
    const info = await getInfoAsync(ART_DIR);
    if (!info.exists) await makeDirectoryAsync(ART_DIR, { intermediates: true });
  } catch {}
}

// ─── Individual file ops ──────────────────────────────────────────────────────

/**
 * Write a base64 data-URI to disk as a JPEG or PNG.
 * Returns the file path.
 */
export async function saveArtFile(
  albumId: string,
  dataUri: string
): Promise<string> {
  const base64 = dataUri.split(",")[1] ?? dataUri;
  const ext = dataUri.includes("image/png") ? "png" : "jpg";
  const filePath = ART_DIR + safeFileKey(albumId) + "." + ext;
  await writeAsStringAsync(filePath, base64, { encoding: "base64" as any });
  return filePath;
}

/**
 * Returns the cached file path for an album if one exists on disk,
 * checking both .jpg and .png variants. Returns null if absent.
 */
export async function artFileExists(albumId: string): Promise<string | null> {
  for (const ext of ["jpg", "png"]) {
    const filePath = ART_DIR + safeFileKey(albumId) + "." + ext;
    try {
      const info = await getInfoAsync(filePath);
      if (info.exists) return filePath;
    } catch {}
  }
  return null;
}

// ─── AsyncStorage index ───────────────────────────────────────────────────────

/**
 * Persist a albumId → filePath map to AsyncStorage so art survives
 * app restarts without re-fetching from iTunes.
 */
export async function saveArtCache(tracks: Track[]): Promise<void> {
  try {
    const artMap: Record<string, string> = {};
    for (const track of tracks) {
      if (
        track.albumArt &&
        !artMap[track.albumId] &&
        !track.albumArt.startsWith("data:")
      ) {
        artMap[track.albumId] = track.albumArt;
      }
    }
    await AsyncStorage.setItem(ART_CACHE_KEY, JSON.stringify(artMap));
  } catch {}
}

/** Load the persisted albumId → filePath map from AsyncStorage. */
export async function loadArtCache(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(ART_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
