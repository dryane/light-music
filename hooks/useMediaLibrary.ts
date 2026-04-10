import { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
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

const CACHE_KEY = "library_cache_v12";
const ART_CACHE_KEY = "library_art_cache_v7";
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365;
const ART_DIR = (cacheDirectory ?? "") + "album-art/";
const CONCURRENCY = 4;

// Set to true to only scan the Light Phone music folder
// Set to false to scan all audio on the device
const LIGHT_PHONE_MODE = true;

const LIGHT_PHONE_MUSIC_PATH = "/Download/Persisted/Music/";

// Minimum similarity score (0-1) to accept an album art match
const MIN_SCORE = 0.7;

// Set to true to use embedded album art from file metadata as a fallback.
// Keep false for Light Phone — it strips/corrupts embedded art during transcoding.
const USE_EMBEDDED_ART = false;

interface ScanState {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  loading: boolean;
  scanProgress: number;
  error: string | null;
  permissionGranted: boolean;
  fetchingArtAlbumIds: Set<string>;
  scanStatus: string;
}

interface CachedLibrary {
  tracks: Track[];
  timestamp: number;
  assetCount: number;
  assetModTimes?: Record<string, number>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function normalise(str: string) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");
}

function normaliseForMatch(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[a.length][b.length];
  return 1 - distance / Math.max(a.length, b.length);
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

async function pLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, worker)
  );
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

// ─── iTunes Search API ─────────────────────────────────────────────────────

interface ItunesCollection {
  collectionName: string;
  artworkUrl100: string;
  artworkUrl512: string;
  _assigned: boolean;
}

async function fetchArtistCollections(artistName: string): Promise<ItunesCollection[]> {
  try {
    const searchRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=1`
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const artistId = searchData.results?.[0]?.artistId;
    if (!artistId) return [];

    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=200`
    );
    if (!res.ok) return [];
    const data = await res.json();

    return data.results
      .filter((r: any) => r.wrapperType === "collection")
      .map((r: any) => ({
        collectionName: r.collectionName,
        artworkUrl100: r.artworkUrl100,
        artworkUrl512: r.artworkUrl100?.replace("100x100bb", "512x512bb") ?? r.artworkUrl100,
        _assigned: false,
      }));
  } catch {
    return [];
  }
}

async function resolveArtUrl(collection: ItunesCollection): Promise<string | null> {
  try {
    const res512 = await fetch(collection.artworkUrl512, { method: "HEAD" });
    if (res512.ok) return collection.artworkUrl512;
  } catch {}
  return collection.artworkUrl100 ?? null;
}

async function matchAlbumsToCollections(
  albums: { aKey: string; title: string }[],
  collections: ItunesCollection[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (albums.length === 0 || collections.length === 0) return result;

  const normAlbums = albums.map(a => normaliseForMatch(a.title));
  const normCollections = collections.map(c => normaliseForMatch(c.collectionName));

  const scoreMatrix: { albumIndex: number; collectionIndex: number; score: number }[] = [];
  for (let ai = 0; ai < normAlbums.length; ai++) {
    for (let ci = 0; ci < normCollections.length; ci++) {
      const score = similarity(normAlbums[ai], normCollections[ci]);
      if (score >= MIN_SCORE) {
        scoreMatrix.push({ albumIndex: ai, collectionIndex: ci, score });
      }
    }
  }

  scoreMatrix.sort((a, b) => b.score - a.score);

  const assignedAlbums = new Set<number>();
  const assignedCollections = new Set<number>();

  for (const match of scoreMatrix) {
    if (assignedAlbums.has(match.albumIndex)) continue;
    if (assignedCollections.has(match.collectionIndex)) continue;

    assignedAlbums.add(match.albumIndex);
    assignedCollections.add(match.collectionIndex);

    const collection = collections[match.collectionIndex];
    collection._assigned = true;

    const url = await resolveArtUrl(collection);
    if (url) {
      result.set(albums[match.albumIndex].aKey, url);
    }
  }

  return result;
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
    const base64 = await readAsStringAsync(uri, {
      encoding: "base64" as any,
    });

    const binaryStr = atob(base64);
    const buffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      buffer[i] = binaryStr.charCodeAt(i);
    }

    const metadata = await parseBuffer(buffer, {
      mimeType: getMimeType(filename),
      size: buffer.length,
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
    if (USE_EMBEDDED_ART) {
      const cover = selectCover(common.picture);
      if (cover) {
        const b64 = btoa(Array.from(cover.data).map((b) => String.fromCharCode(b)).join(""));
        albumArtBase64 = `data:${cover.format};base64,${b64}`;
      }
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
    if (alb.albumArt) {
      for (const t of alb.tracks) t.albumArt = alb.albumArt;
    }
  }

  const artistMap = new Map<string, Artist>();
  for (const alb of albumMap.values()) {
    if (!artistMap.has(alb.artistId)) {
      artistMap.set(alb.artistId, {
        id: alb.artistId,
        name: alb.artist,
        albums: [],
        trackCount: 0,
      });
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

  for (const [key, artist] of artistMap.entries()) {
    if (isUnknown(artist.name)) artistMap.delete(key);
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
    fetchingArtAlbumIds: new Set(),
    scanStatus: "",
  });
  const cancelled = useRef(false);
  const cacheRef = useRef<CachedLibrary | null>(null);
  const appState = useRef(AppState.currentState);
  const scanInProgress = useRef(false);

  const loadCache = useCallback(async (): Promise<CachedLibrary | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cache: CachedLibrary = JSON.parse(raw);
      if (Date.now() - cache.timestamp > CACHE_MAX_AGE_MS) return null;
      return cache;
    } catch { return null; }
  }, []);

  const saveCache = useCallback(async (
    tracks: Track[],
    assetCount: number,
    assetModTimes: Record<string, number>
  ) => {
    try {
      const cache: CachedLibrary = { tracks, timestamp: Date.now(), assetCount, assetModTimes };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      cacheRef.current = cache;
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

const scan = useCallback(async (silent = false, existingCache?: CachedLibrary | null, skipArt = false) => {
    if (scanInProgress.current) return;
    scanInProgress.current = true;
    cancelled.current = false;
    if (!silent) setState((s) => ({ ...s, loading: true, scanProgress: 0, error: null }));

    try {
      let assets: MediaLibrary.Asset[] = [];
      let after: string | undefined;
      let hasMore = true;
      while (hasMore) {
        const page = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 300,
          after,
          sortBy: MediaLibrary.SortBy.default,
        });
        assets = [...assets, ...page.assets];
        hasMore = page.hasNextPage;
        after = page.endCursor;
      }

      if (LIGHT_PHONE_MODE) {
        assets = assets.filter((asset) =>
          asset.uri.includes(LIGHT_PHONE_MUSIC_PATH)
        );
      }

      if (cancelled.current) return;

      await ensureArtDir();
      const artCache = new Map<string, string | null>();

      const cachedTrackMap = new Map<string, Track>();
      if (existingCache?.tracks) {
        for (const t of existingCache.tracks) cachedTrackMap.set(t.id, t);
      }
      const cachedModTimes = existingCache?.assetModTimes ?? {};

      const savedArtMap = await loadArtCache();
      for (const [albumId, artPath] of Object.entries(savedArtMap)) {
        artCache.set(albumId, artPath);
      }

      if (existingCache?.tracks) {
        for (const t of existingCache.tracks) {
          if (t.albumArt && !artCache.has(t.albumId)) {
            artCache.set(t.albumId, t.albumArt);
          }
        }
      }

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

      const tracks: Track[] = [];
      for (const asset of cachedAssets) {
        const cached = cachedTrackMap.get(asset.id)!;
        const resolvedArt = artCache.get(cached.albumId) ?? cached.albumArt ?? null;
        tracks.push({ ...cached, albumArt: resolvedArt });
      }

      // ── Phase 1: Metadata only ────────────────────────────────────────────
      if (newAssets.length > 0) {
        let processed = 0;

        const tasks = newAssets.map((asset) => async () => {
          if (cancelled.current) return;

          const meta = await readMetadata(asset.uri, asset.filename);
          const aKey = albumKey(meta.artist, meta.album);

          if (!artCache.has(aKey)) {
            const existing = await artFileExists(aKey);
            if (existing) {
              artCache.set(aKey, existing);
            } else if (USE_EMBEDDED_ART && meta.albumArtBase64) {
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
            setState((s) => ({
              ...s,
              scanProgress: (cachedAssets.length + processed) / assets.length,
              scanStatus: `${meta.artist ?? "Unknown"} — ${meta.album ?? "Unknown"}`,
            }));
          }
        });

        await pLimit(tasks, CONCURRENCY);
      }

      if (cancelled.current) return;

      // ── Show library immediately after phase 1 ────────────────────────────
      const newModTimes: Record<string, number> = {};
      for (const asset of assets) {
        newModTimes[asset.id] = (asset as any).modificationTime ?? 0;
      }

      const sortedTracksPhase1 = [...tracks].sort((a, b) => a.title.localeCompare(b.title));
      const lib1 = buildLibrary(tracks);
      await saveCache(sortedTracksPhase1, assets.length, newModTimes);
      await saveArtCache(sortedTracksPhase1);
      setState({
        tracks: sortedTracksPhase1,
        albums: lib1.albums,
        artists: lib1.artists,
        loading: false,
        scanProgress: 1,
        scanStatus: "",
        error: null,
        permissionGranted: true,
        fetchingArtAlbumIds: new Set(),
      });

      // ── Phase 2: iTunes art ───────────────────────────────────────────────
      const artistAlbums = new Map<string, { aKey: string; title: string }[]>();
      const seen = new Set<string>();
      for (const track of tracks) {
        if (
          artCache.get(track.albumId) ||
          isUnknown(track.artist) ||
          isUnknown(track.album)
        ) continue;
        if (!seen.has(track.albumId)) {
          seen.add(track.albumId);
          if (!artistAlbums.has(track.artist)) artistAlbums.set(track.artist, []);
          artistAlbums.get(track.artist)!.push({ aKey: track.albumId, title: track.album });
        }
      }

      if (artistAlbums.size > 0 && !skipArt) {
        const allMissingIds = new Set<string>();
        for (const albumList of artistAlbums.values()) {
          albumList.forEach(a => allMissingIds.add(a.aKey));
        }
        setState((s) => ({ ...s, fetchingArtAlbumIds: allMissingIds }));

        for (const [artistName, albumList] of artistAlbums) {
          if (cancelled.current) break;

          const collections = await fetchArtistCollections(artistName);
          const artResults = await matchAlbumsToCollections(albumList, collections);

          for (const { aKey } of albumList) {
            const url = artResults.get(aKey) ?? null;
            if (url) {
              artCache.set(aKey, url);
              for (const track of tracks) {
                if (track.albumId === aKey) track.albumArt = url;
              }
            }
          }

          const sortedTracks = [...tracks].sort((a, b) => a.title.localeCompare(b.title));
          const { albums, artists } = buildLibrary(tracks);
          setState((s) => {
            const next = new Set(s.fetchingArtAlbumIds);
            albumList.forEach(({ aKey }) => next.delete(aKey));
            return { ...s, tracks: sortedTracks, albums, artists, fetchingArtAlbumIds: next };
          });
        }

        await saveArtCache(tracks);
      }

    } catch (e: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e?.message ?? "Failed to scan music library",
      }));
    } finally {
      scanInProgress.current = false;
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
      cacheRef.current = cache;

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
          scanStatus: "",
          error: null,
          permissionGranted: true,
          fetchingArtAlbumIds: new Set(),
        });
        setTimeout(() => scan(true, cache, true), 2000);
      } else {
        await scan(false, null, false);
      }
    })();

    // Rescan silently when app comes to foreground
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        scan(true, cacheRef.current, true); // ← true = skip art fetch
      }
      appState.current = nextState;
    });

    return () => {
      cancelled.current = true;
      sub.remove();
    };
  }, []);

  return {
    ...state,
    requestPermission,
    refresh: () => scan(false, null),
  };
}
