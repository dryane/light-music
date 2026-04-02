import { useState, useEffect, useCallback, useRef } from "react";
import * as MediaLibrary from "expo-media-library";
import {
  readAsStringAsync,
  writeAsStringAsync,
  getInfoAsync,
  makeDirectoryAsync,
  cacheDirectory,
} from "expo-file-system/legacy";
import { parseBuffer, selectCover } from "music-metadata";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track, Album, Artist } from "@/types/music";

// Bump to force rescan with optimized code
const CACHE_KEY = "library_cache_v5";
const ART_CACHE_KEY = "library_art_cache_v3";
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365;
const ART_DIR = (cacheDirectory ?? "") + "album-art/";
const MB_USER_AGENT = "LightMusic/1.0 (lightmusic@example.com)";
const MB_RATE_LIMIT_MS = 1100;

// How many files to read concurrently — too high causes I/O contention
const CONCURRENCY = 4;

// Max bytes to read per file for metadata
// ID3 tags are at the start of MP3s, MP4 atoms at start of M4As
// 256KB covers virtually all embedded artwork + tags
const MAX_READ_BYTES = 256 * 1024;

interface ScanState {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  loading: boolean;
  scanProgress: number;
  error: string | null;
  permissionGranted: boolean;
}

interface CachedLibrary {
  tracks: Track[];
  timestamp: number;
  assetCount: number;
  // Map of assetId -> modification time for incremental scan
  assetModTimes?: Record<string, number>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function normalise(str: string) {
  return str.trim().toLowerCase();
}

function albumKey(artist: string, album: string) {
  return `${normalise(artist)}__${normalise(album)}`;
}

function artistKey(artist: string) {
  return normalise(artist);
}

function safeFileKey(key: string) {
  return key.replace(/[^a-z0-9]/gi, "_").substring(0, 100);
}

function parseFilename(filename: string): { title: string; artist: string } {
  const name = filename.replace(/\.[^.]+$/, "");
  const parts = name.split(" - ");
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: "Unknown Artist", title: name.trim() };
}

function isUnknown(val: string | null | undefined): boolean {
  if (!val) return true;
  const v = val.trim().toLowerCase();
  return v === "" || v === "unknown" || v === "unknown artist" || v === "unknown album";
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp3": return "audio/mpeg";
    case "m4a": return "audio/mp4";
    case "aac": return "audio/aac";
    case "flac": return "audio/flac";
    case "ogg": return "audio/ogg";
    case "wav": return "audio/wav";
    default: return "audio/mpeg";
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Run async tasks with limited concurrency
async function pLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
  onProgress?: (done: number, total: number) => void
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;
  let done = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
      done++;
      onProgress?.(done, tasks.length);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ─── Art filesystem ────────────────────────────────────────────────────────

async function ensureArtDir() {
  try {
    const info = await getInfoAsync(ART_DIR);
    if (!info.exists) await makeDirectoryAsync(ART_DIR, { intermediates: true });
  } catch {}
}

async function saveArtFile(albumId: string, dataUri: string): Promise<string> {
  const base64 = dataUri.split(",")[1] ?? dataUri;
  const ext = dataUri.includes("image/png") ? "png" : "jpg";
  const filePath = ART_DIR + safeFileKey(albumId) + "." + ext;
  await writeAsStringAsync(filePath, base64, { encoding: "base64" as any });
  return filePath;
}

async function artFileExists(albumId: string): Promise<string | null> {
  for (const ext of ["jpg", "png"]) {
    const filePath = ART_DIR + safeFileKey(albumId) + "." + ext;
    try {
      const info = await getInfoAsync(filePath);
      if (info.exists) return filePath;
    } catch {}
  }
  return null;
}

// ─── MusicBrainz ──────────────────────────────────────────────────────────

async function fetchMusicBrainzArt(artist: string, album: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`artist:"${artist}" release:"${album}"`);
    const res = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=${query}&fmt=json&limit=5`,
      { headers: { "User-Agent": MB_USER_AGENT } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const releases: any[] = data.releases ?? [];
    for (const release of releases) {
      try {
        const artRes = await fetch(
          `https://coverartarchive.org/release/${release.id}/front`,
          { method: "HEAD", headers: { "User-Agent": MB_USER_AGENT } }
        );
        if (artRes.ok || artRes.status === 307 || artRes.status === 302) {
          return `https://coverartarchive.org/release/${release.id}/front-500`;
        }
      } catch {}
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Metadata reading ──────────────────────────────────────────────────────

async function readMetadata(uri: string, filename: string): Promise<{
  title: string;
  artist: string;
  album: string;
  albumArtBase64: string | null;
  year: number | null;
  trackNumber: number | null;
}> {
  const fallback = parseFilename(filename);
  try {
    // Only read first 256KB — enough for tags and embedded art thumbnail
    // This is the key optimization — avoids reading multi-MB audio data
    const base64 = await readAsStringAsync(uri, {
      encoding: "base64" as any,
      length: MAX_READ_BYTES,
      position: 0,
    } as any);

    // Decode base64 to binary more efficiently using Uint8Array directly
    const binaryStr = atob(base64);
    const buffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      buffer[i] = binaryStr.charCodeAt(i);
    }

    // Tell music-metadata to stop parsing after tags — don't parse audio frames
    const metadata = await parseBuffer(buffer, {
      mimeType: getMimeType(filename),
      size: buffer.length,
    }, {
      skipPostHeaders: true,    // skip scanning past the tag headers
      skipCovers: false,        // we DO want covers
      duration: false,          // don't calculate duration (we have it from MediaLibrary)
    });

    const { common } = metadata;
    const title = common.title?.trim() || fallback.title;
    const artist =
      (!isUnknown(common.albumartist) ? common.albumartist?.trim() : null) ||
      (!isUnknown(common.artist) ? common.artist?.trim() : null) ||
      fallback.artist;
    const album = (!isUnknown(common.album) ? common.album?.trim() : null) || "Unknown Album";
    const year = common.year ?? null;
    const trackNumber = common.track?.no ?? null;

    let albumArtBase64: string | null = null;
    const cover = selectCover(common.picture);
    if (cover) {
      const b64 = btoa(Array.from(cover.data).map((b) => String.fromCharCode(b)).join(""));
      albumArtBase64 = `data:${cover.format};base64,${b64}`;
    }

    return { title, artist, album, albumArtBase64, year, trackNumber };
  } catch {
    return {
      title: fallback.title,
      artist: fallback.artist,
      album: "Unknown Album",
      albumArtBase64: null,
      year: null,
      trackNumber: null,
    };
  }
}

// ─── Library builder ───────────────────────────────────────────────────────

function buildLibrary(tracks: Track[]): { albums: Album[]; artists: Artist[] } {
  const albumMap = new Map<string, Album>();

  for (const track of tracks) {
    if (!albumMap.has(track.albumId)) {
      albumMap.set(track.albumId, {
        id: track.albumId,
        title: track.album,
        artist: track.artist,
        artistId: track.artistId,
        year: track.year,
        albumArt: track.albumArt,
        tracks: [],
      });
    }
    const alb = albumMap.get(track.albumId)!;
    alb.tracks.push(track);
    if (!alb.albumArt && track.albumArt) alb.albumArt = track.albumArt;
    if (track.year && (!alb.year || track.year < alb.year)) alb.year = track.year;
  }

  for (const alb of albumMap.values()) {
    alb.tracks.sort((a, b) => {
      if (a.trackNumber && b.trackNumber) return a.trackNumber - b.trackNumber;
      if (a.trackNumber) return -1;
      if (b.trackNumber) return 1;
      return a.title.localeCompare(b.title);
    });
    // Propagate resolved art to all tracks on album
    if (alb.albumArt) {
      for (const t of alb.tracks) t.albumArt = alb.albumArt;
    }
  }

  const artistMap = new Map<string, Artist>();
  for (const alb of albumMap.values()) {
    if (!artistMap.has(alb.artistId)) {
      artistMap.set(alb.artistId, { id: alb.artistId, name: alb.artist, albums: [], trackCount: 0 });
    }
    const art = artistMap.get(alb.artistId)!;
    art.albums.push(alb);
    art.trackCount += alb.tracks.length;
  }

  for (const art of artistMap.values()) {
    art.albums.sort((a, b) => {
      if (a.year && b.year) return a.year - b.year;
      if (a.year) return -1;
      if (b.year) return 1;
      return a.title.localeCompare(b.title);
    });
  }

  const sortedArtists = Array.from(artistMap.values()).sort((a, b) => {
    if (isUnknown(a.name)) return 1;
    if (isUnknown(b.name)) return -1;
    const nameA = a.name.replace(/^the\s+/i, "").replace(/^a\s+/i, "");
    const nameB = b.name.replace(/^the\s+/i, "").replace(/^a\s+/i, "");
    return nameA.localeCompare(nameB);
  });

  const sortedAlbums = Array.from(albumMap.values()).sort((a, b) => {
    if (a.year && b.year) return a.year - b.year;
    if (a.year) return -1;
    if (b.year) return 1;
    return a.title.localeCompare(b.title);
  });

  return { albums: sortedAlbums, artists: sortedArtists };
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useMediaLibrary() {
  const [state, setState] = useState<ScanState>({
    tracks: [],
    albums: [],
    artists: [],
    loading: true,
    scanProgress: 0,
    error: null,
    permissionGranted: false,
  });
  const cancelled = useRef(false);

  const loadCache = useCallback(async (): Promise<CachedLibrary | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cache: CachedLibrary = JSON.parse(raw);
      if (Date.now() - cache.timestamp > CACHE_MAX_AGE_MS) return null;
      return cache;
    } catch { return null; }
  }, []);

  const saveCache = useCallback(async (tracks: Track[], assetCount: number, assetModTimes: Record<string, number>) => {
    try {
      const cache: CachedLibrary = { tracks, timestamp: Date.now(), assetCount, assetModTimes };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }, []);

  const saveArtCache = useCallback(async (tracks: Track[]) => {
    try {
      const artMap: Record<string, string> = {};
      for (const track of tracks) {
        if (track.albumArt && !artMap[track.albumId] && !track.albumArt.startsWith("data:")) {
          artMap[track.albumId] = track.albumArt;
        }
      }
      await AsyncStorage.setItem(ART_CACHE_KEY, JSON.stringify(artMap));
    } catch {}
  }, []);

  const loadArtCache = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const raw = await AsyncStorage.getItem(ART_CACHE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch { return {}; }
  }, []);

  const scan = useCallback(async (silent = false, existingCache?: CachedLibrary | null) => {
    cancelled.current = false;
    if (!silent) setState((s) => ({ ...s, loading: true, scanProgress: 0, error: null }));

    try {
      // Get Music folder only
      const allAlbums = await MediaLibrary.getAlbumsAsync();
      const musicFolder = allAlbums.find((a) => a.title === "Music" || a.title === "music");

      let assets: MediaLibrary.Asset[] = [];
      let after: string | undefined;
      let hasMore = true;
      while (hasMore) {
        const page = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 300,
          after,
          sortBy: MediaLibrary.SortBy.default,
          album: musicFolder ?? undefined,
        });
        assets = [...assets, ...page.assets];
        hasMore = page.hasNextPage;
        after = page.endCursor;
      }

      if (cancelled.current) return;

      await ensureArtDir();
      const artCache = new Map<string, string | null>();
      const mbAttempted = new Set<string>();

      // Build lookup of existing cached tracks for incremental scan
      const cachedTrackMap = new Map<string, Track>();
      if (existingCache?.tracks) {
        for (const t of existingCache.tracks) cachedTrackMap.set(t.id, t);
      }
      const cachedModTimes = existingCache?.assetModTimes ?? {};

      // Load existing art cache into artCache map
      const savedArtMap = await loadArtCache();
      for (const [albumId, artPath] of Object.entries(savedArtMap)) {
        artCache.set(albumId, artPath);
      }

      // Separate assets into: already cached (skip metadata read) vs new/changed
      const newAssets: MediaLibrary.Asset[] = [];
      const cachedAssets: MediaLibrary.Asset[] = [];

      for (const asset of assets) {
        const modTime = (asset as any).modificationTime ?? 0;
        const prevModTime = cachedModTimes[asset.id];
        const hasCachedTrack = cachedTrackMap.has(asset.id);

        if (hasCachedTrack && prevModTime && prevModTime === modTime) {
          cachedAssets.push(asset);
        } else {
          newAssets.push(asset);
        }
      }

      // Reuse cached tracks for unchanged files
      const tracks: Track[] = [];
      for (const asset of cachedAssets) {
        const cached = cachedTrackMap.get(asset.id)!;
        // Apply latest art from art cache
        const resolvedArt = artCache.get(cached.albumId) ?? cached.albumArt ?? null;
        tracks.push({ ...cached, albumArt: resolvedArt });
      }

      // Read metadata only for new/changed files — concurrently
      if (newAssets.length > 0) {
        let processed = 0;

        const tasks = newAssets.map((asset) => async () => {
          if (cancelled.current) return;

          const meta = await readMetadata(asset.uri, asset.filename);
          const aKey = albumKey(meta.artist, meta.album);

          // Resolve art for this album
          if (!artCache.has(aKey)) {
            const existing = await artFileExists(aKey);
            if (existing) {
              artCache.set(aKey, existing);
            } else if (meta.albumArtBase64) {
              try {
                const filePath = await saveArtFile(aKey, meta.albumArtBase64);
                artCache.set(aKey, filePath);
              } catch {
                artCache.set(aKey, null);
              }
            } else {
              artCache.set(aKey, null);
            }
          }

          tracks.push({
            id: asset.id,
            title: meta.title,
            artist: meta.artist,
            artistId: artistKey(meta.artist),
            album: meta.album,
            albumId: aKey,
            albumArt: artCache.get(aKey) ?? null,
            duration: asset.duration * 1000,
            uri: asset.uri,
            year: meta.year,
            trackNumber: meta.trackNumber,
          });

          processed++;
          if (!silent) {
            const total = assets.length;
            const done = cachedAssets.length + processed;
            setState((s) => ({ ...s, scanProgress: done / total }));
          }
        });

        // Process new files with limited concurrency
        await pLimit(tasks, CONCURRENCY);
      }

      if (cancelled.current) return;

      // MusicBrainz pass — only for albums still missing art
      const albumsMissingArt = new Set<string>();
      for (const track of tracks) {
        const aKey = track.albumId;
        if (!artCache.get(aKey) && !isUnknown(track.artist) && !isUnknown(track.album)) {
          albumsMissingArt.add(aKey);
        }
      }

      for (const aKey of albumsMissingArt) {
        if (cancelled.current) break;
        if (mbAttempted.has(aKey)) continue;
        mbAttempted.add(aKey);

        const sample = tracks.find((t) => t.albumId === aKey);
        if (!sample) continue;

        const mbUrl = await fetchMusicBrainzArt(sample.artist, sample.album);
        if (mbUrl) artCache.set(aKey, mbUrl);
        await delay(MB_RATE_LIMIT_MS);
      }

      // Apply final resolved art to all tracks
      for (const track of tracks) {
        track.albumArt = artCache.get(track.albumId) ?? null;
      }

      const sortedTracks = [...tracks].sort((a, b) => a.title.localeCompare(b.title));
      const { albums, artists } = buildLibrary(tracks);

      // Build mod time map for next incremental scan
      const newModTimes: Record<string, number> = {};
      for (const asset of assets) {
        newModTimes[asset.id] = (asset as any).modificationTime ?? 0;
      }

      await saveCache(sortedTracks, assets.length, newModTimes);
      await saveArtCache(sortedTracks);

      setState({
        tracks: sortedTracks,
        albums,
        artists,
        loading: false,
        scanProgress: 1,
        error: null,
        permissionGranted: true,
      });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message ?? "Failed to scan" }));
    }
  }, [saveCache, saveArtCache, loadArtCache]);

  const requestPermission = useCallback(async () => {
    const { granted } = await MediaLibrary.requestPermissionsAsync();
    if (granted) {
      setState((s) => ({ ...s, permissionGranted: true }));
      await scan(false, null);
    }
  }, [scan]);

  useEffect(() => {
    (async () => {
      const { granted } = await MediaLibrary.getPermissionsAsync();
      if (!granted) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      setState((s) => ({ ...s, permissionGranted: true }));

      const cache = await loadCache();
      if (cache && cache.tracks.length > 0) {
        const artMap = await loadArtCache();
        const tracksWithArt = cache.tracks.map((t) => ({
          ...t,
          albumArt: artMap[t.albumId] ?? t.albumArt ?? null,
        }));
        const { albums, artists } = buildLibrary(tracksWithArt);
        setState({
          tracks: tracksWithArt,
          albums,
          artists,
          loading: false,
          scanProgress: 1,
          error: null,
          permissionGranted: true,
        });
        // Background rescan — pass cache for incremental diff
        setTimeout(() => scan(true, cache), 2000);
      } else {
        await scan(false, null);
      }
    })();

    return () => { cancelled.current = true; };
  }, []);

  return {
    ...state,
    requestPermission,
    refresh: () => scan(false, null),
  };
}
