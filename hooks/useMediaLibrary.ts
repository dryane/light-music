/**
 * useMediaLibrary — orchestrates the two-phase library scan.
 *
 * Phase 1: Read metadata for all new/changed assets, show library immediately.
 * Phase 2: Fetch missing album art from iTunes in the background (per-artist).
 *
 * Pure utility logic has been extracted to:
 *   utils/stringUtils.ts    — normalisation, key generation, isUnknown
 *   utils/async.ts          — pLimit, delay
 *   utils/artCache.ts       — filesystem art read/write + AsyncStorage index
 *   utils/itunesArt.ts      — iTunes API + greedy album matching
 *   utils/metadataReader.ts — audio file metadata parsing
 *   utils/libraryBuilder.ts — buildLibrary (albums + artists from flat tracks)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Track, Album, Artist } from "@/types/music";
import { albumKey, artistKey, isUnknown } from "@/utils/stringUtils";
import { pLimit } from "@/utils/async";
import {
  ensureArtDir,
  saveArtFile,
  artFileExists,
  saveArtCache,
  loadArtCache,
} from "@/utils/artCache";
import { fetchArtForArtist } from "@/utils/itunesArt";
import { fetchArtForArtistFromMB } from "@/utils/musicBrainzArt";
import { readMetadata } from "@/utils/metadataReader";
import { buildLibrary } from "@/utils/libraryBuilder";

// ─── Config ───────────────────────────────────────────────────────────────────

const CACHE_KEY = "library_cache_v14";
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365;
const ART_TTL_KEY = "art_fetch_last_run";
const ART_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const CONCURRENCY = 4;

/** When true, only scans /Download/Persisted/Music/ (Light Phone target path). */
const LIGHT_PHONE_MODE = true;
const LIGHT_PHONE_MUSIC_PATH = "/Download/Persisted/Music/";

// Set to true to save embedded cover art extracted from file metadata.
// Keep false for Light Phone — the device transcoder corrupts embedded art.
const USE_EMBEDDED_ART = false;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScanState {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  loading: boolean;
  initialized: boolean;
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

const INITIAL_STATE: ScanState = {
  tracks: [],
  albums: [],
  artists: [],
  loading: true,
  initialized: false,
  scanProgress: 0,
  error: null,
  permissionGranted: false,
  fetchingArtAlbumIds: new Set(),
  scanStatus: "",
};

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function loadLibraryCache(): Promise<CachedLibrary | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: CachedLibrary = JSON.parse(raw);
    if (Date.now() - cache.timestamp > CACHE_MAX_AGE_MS) return null;
    return cache;
  } catch {
    return null;
  }
}

async function saveLibraryCache(
  tracks: Track[],
  assetCount: number,
  assetModTimes: Record<string, number>
): Promise<void> {
  try {
    const cache: CachedLibrary = {
      tracks,
      timestamp: Date.now(),
      assetCount,
      assetModTimes,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMediaLibrary() {
  const [state, setState] = useState<ScanState>(INITIAL_STATE);

  const cancelled = useRef(false);
  const cacheRef = useRef<CachedLibrary | null>(null);
  const appState = useRef(AppState.currentState);
  const scanInProgress = useRef(false);
  const firstScanRef = useRef(false);

  // ── Scan ────────────────────────────────────────────────────────────────────
  const silentScanRef = useRef(false);

  const scan = useCallback(
    async (
      silent = false,
      existingCache?: CachedLibrary | null,
    ) => {
      // If a scan is already running, only block if this is also silent
      // A non-silent (user-facing) scan always takes priority
      if (scanInProgress.current) {
        if (silent) return;
        // Cancel the in-progress silent scan and take over
        cancelled.current = true;
        // Wait a tick for the cancelled scan to bail out
        await new Promise<void>((r) => setTimeout(r, 0));
      }
      scanInProgress.current = true;
      silentScanRef.current = silent;
      cancelled.current = false;

      if (!silent) {
        setState((s) => ({ ...s, loading: true, scanProgress: 0, error: null }));
      }

      try {
        // ── Fetch all audio assets ─────────────────────────────────────────
        let assets: MediaLibrary.Asset[] = [];
        let after: string | undefined;
        let hasMore = true;

        if (!silent) {
          setState((s) => ({ ...s, scanStatus: "Finding audio files…" }));
        }

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
          assets = assets.filter((a) => a.uri.includes(LIGHT_PHONE_MUSIC_PATH));
        }

        if (cancelled.current) return;

        if (!silent) {
          setState((s) => ({ ...s, scanStatus: "Preparing library…" }));
        }

        await ensureArtDir();

        // ── Restore cached art + mod times ─────────────────────────────────
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

        // ── Split assets into cached vs new ────────────────────────────────
        const newAssets: MediaLibrary.Asset[] = [];
        const cachedAssets: MediaLibrary.Asset[] = [];

        for (const asset of assets) {
          const modTime = (asset as any).modificationTime ?? 0;
          const hasCachedTrack = cachedTrackMap.has(asset.id);
          const prevModTime = cachedModTimes[asset.id];
          if (hasCachedTrack && prevModTime && prevModTime === modTime) {
            cachedAssets.push(asset);
          } else {
            newAssets.push(asset);
          }
        }

        const tracks: Track[] = [];

        // Restore unchanged tracks from cache
        for (const asset of cachedAssets) {
          const cached = cachedTrackMap.get(asset.id)!;
          const resolvedArt = artCache.get(cached.albumId) ?? cached.albumArt ?? null;
          tracks.push({ ...cached, albumArt: resolvedArt });
        }

        // Show progress for cached assets immediately
        if (!silent && cachedAssets.length > 0 && assets.length > 0) {
          setState((s) => ({
            ...s,
            scanProgress: cachedAssets.length / assets.length,
            scanStatus: "Reading your music files…",
          }));
        }

        // ── Phase 1: Metadata scan ─────────────────────────────────────────

        if (newAssets.length > 0) {
          let processed = 0;
          let lastStatus = "Reading your music files…";

          // Progress updates via interval timer — runs on the main event loop
          // so React can paint, regardless of how pLimit batches the work
          let progressInterval: ReturnType<typeof setInterval> | null = null;
          if (!silent) {
            setState((s) => ({ ...s, scanStatus: lastStatus }));
            progressInterval = setInterval(() => {
              setState((s) => ({
                ...s,
                scanProgress: (cachedAssets.length + processed) / assets.length,
                scanStatus: lastStatus,
              }));
            }, 50);
          }

          const tasks = newAssets.map((asset) => async () => {
            if (cancelled.current) return;

            const meta = await readMetadata(asset.uri, asset.filename);
            const aKey = albumKey(meta.albumArtist, meta.album);

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
              albumArtist: meta.albumArtist,
              artistId: artistKey(meta.albumArtist),
              album: meta.album,
              albumId: aKey,
              albumArt: artCache.get(aKey) ?? null,
              duration: asset.duration * 1000,
              uri: asset.uri,
              year: meta.year,
              releaseDate: meta.releaseDate,
              trackNumber: meta.trackNumber,
            });

            processed++;
            lastStatus = `${meta.albumArtist ?? "Unknown"} — ${meta.album ?? "Unknown"}`;
          });

          await pLimit(tasks, CONCURRENCY);

          // Clean up progress timer and do a final update
          if (progressInterval) {
            clearInterval(progressInterval);
            setState((s) => ({
              ...s,
              scanProgress: (cachedAssets.length + newAssets.length) / assets.length,
              scanStatus: "",
            }));
          }
        }

        if (cancelled.current) return;

        // ── Show library after Phase 1 ─────────────────────────────────────
        const newModTimes: Record<string, number> = {};
        for (const asset of assets) {
          newModTimes[asset.id] = (asset as any).modificationTime ?? 0;
        }

        const sortedTracks = [...tracks].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
        const lib1 = buildLibrary(tracks);

        await saveLibraryCache(sortedTracks, assets.length, newModTimes);
        await saveArtCache(sortedTracks);

        setState({
          tracks: sortedTracks,
          albums: lib1.albums,
          artists: lib1.artists,
          loading: false,
          initialized: true,
          scanProgress: 1,
          scanStatus: "",
          error: null,
          permissionGranted: true,
          fetchingArtAlbumIds: new Set(),
        });
      } catch (e: any) {
        setState((s) => ({
          ...s,
          loading: false,
          error: e?.message ?? "Failed to scan music library",
        }));
      } finally {
        scanInProgress.current = false;
      }
    },
    []
  );

  // ── Fetch missing album art (Phase 2) — TTL gated, called from album view ──
  const artFetchInProgress = useRef(false);

  const fetchMissingArt = useCallback(async () => {
    if (artFetchInProgress.current) return;

    // Check TTL — only run once per 24 hours
    try {
      const lastRun = await AsyncStorage.getItem(ART_TTL_KEY);
      if (lastRun && Date.now() - Number(lastRun) < ART_TTL_MS) return;
    } catch {}

    let tracks = [...state.tracks];
    if (tracks.length === 0) return;

    artFetchInProgress.current = true;

    try {
      const savedArtMap = await loadArtCache();
      const artCache = new Map<string, string | null>(Object.entries(savedArtMap));

      // Build per-artist list of albums missing art
      const artistAlbums = new Map<string, { aKey: string; title: string }[]>();
      const seen = new Set<string>();

      for (const track of tracks) {
        if (
          artCache.get(track.albumId) ||
          track.albumArt ||
          isUnknown(track.albumArtist) ||
          isUnknown(track.album)
        )
          continue;
        if (!seen.has(track.albumId)) {
          seen.add(track.albumId);
          if (!artistAlbums.has(track.albumArtist))
            artistAlbums.set(track.albumArtist, []);
          artistAlbums
            .get(track.albumArtist)!
            .push({ aKey: track.albumId, title: track.album });
        }
      }

      if (artistAlbums.size === 0) {
        // Nothing to fetch — still mark as run so we don't check again today
        await AsyncStorage.setItem(ART_TTL_KEY, String(Date.now()));
        artFetchInProgress.current = false;
        return;
      }

      const allMissingIds = new Set<string>();
      for (const albumList of artistAlbums.values()) {
        albumList.forEach((a) => allMissingIds.add(a.aKey));
      }
      setState((s) => ({ ...s, fetchingArtAlbumIds: allMissingIds }));

      for (const [artistName, albumList] of artistAlbums) {
        if (cancelled.current) break;

        const artResults = await fetchArtForArtist(artistName, albumList);

        for (const { aKey } of albumList) {
          const result = artResults.get(aKey);
          if (result) {
            if (result.artUrl) artCache.set(aKey, result.artUrl);
          }
        }

        // Produce new track refs for any tracks updated by this artist batch
        tracks = tracks.map((track) => {
          const result = artResults.get(track.albumId);
          if (!result) return track;
          let changed = false;
          let albumArt = track.albumArt;
          let releaseDate = track.releaseDate;
          if (result.artUrl) {
            albumArt = result.artUrl;
            changed = true;
          }
          if (result.releaseDate && (!releaseDate || releaseDate.length < result.releaseDate.length)) {
            releaseDate = result.releaseDate;
            changed = true;
          }
          return changed ? { ...track, albumArt, releaseDate } : track;
        });

        const updatedSorted = [...tracks].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
        const { albums, artists } = buildLibrary(tracks);

        setState((s) => {
          const next = new Set(s.fetchingArtAlbumIds);
          albumList.forEach(({ aKey }) => next.delete(aKey));
          return {
            ...s,
            tracks: updatedSorted,
            albums,
            artists,
            fetchingArtAlbumIds: next,
          };
        });
      }

      await saveArtCache(tracks);

      // ── MusicBrainz fallback for albums still missing art ──────────────
      const mbArtistAlbums = new Map<string, { aKey: string; title: string }[]>();
      const mbSeen = new Set<string>();

      for (const track of tracks) {
        if (
          track.albumArt ||
          isUnknown(track.albumArtist) ||
          isUnknown(track.album)
        )
          continue;
        if (!mbSeen.has(track.albumId)) {
          mbSeen.add(track.albumId);
          if (!mbArtistAlbums.has(track.albumArtist))
            mbArtistAlbums.set(track.albumArtist, []);
          mbArtistAlbums
            .get(track.albumArtist)!
            .push({ aKey: track.albumId, title: track.album });
        }
      }

      if (mbArtistAlbums.size > 0) {
        const mbMissingIds = new Set<string>();
        for (const albumList of mbArtistAlbums.values()) {
          albumList.forEach((a) => mbMissingIds.add(a.aKey));
        }
        setState((s) => ({ ...s, fetchingArtAlbumIds: mbMissingIds }));

        for (const [artistName, albumList] of mbArtistAlbums) {
          if (cancelled.current) break;

          const mbResults = await fetchArtForArtistFromMB(artistName, albumList);

          for (const { aKey } of albumList) {
            const result = mbResults.get(aKey);
            if (result) {
              if (result.artUrl) artCache.set(aKey, result.artUrl);
            }
          }

          // Produce new track refs for any tracks updated by this MB batch
          tracks = tracks.map((track) => {
            const result = mbResults.get(track.albumId);
            if (!result) return track;
            let changed = false;
            let albumArt = track.albumArt;
            let releaseDate = track.releaseDate;
            if (result.artUrl) {
              albumArt = result.artUrl;
              changed = true;
            }
            if (result.releaseDate && (!releaseDate || releaseDate.length < result.releaseDate.length)) {
              releaseDate = result.releaseDate;
              changed = true;
            }
            return changed ? { ...track, albumArt, releaseDate } : track;
          });

          const updatedSorted = [...tracks].sort((a, b) =>
            a.title.localeCompare(b.title)
          );
          const { albums, artists } = buildLibrary(tracks);

          setState((s) => {
            const next = new Set(s.fetchingArtAlbumIds);
            albumList.forEach(({ aKey }) => next.delete(aKey));
            return {
              ...s,
              tracks: updatedSorted,
              albums,
              artists,
              fetchingArtAlbumIds: next,
            };
          });
        }

        await saveArtCache(tracks);
      }

      await AsyncStorage.setItem(ART_TTL_KEY, String(Date.now()));
    } catch {} finally {
      artFetchInProgress.current = false;
    }
  }, [state.tracks]);

  // ── Permission request ───────────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    const { granted } = await MediaLibrary.requestPermissionsAsync();
    if (granted) {
      setState((s) => ({ ...s, permissionGranted: true, initialized: true, loading: true, scanProgress: 0 }));
      await scan(false, null);
    }
  }, [scan]);

  // ── Boot: load cache → show immediately → background rescan ─────────────
  useEffect(() => {
    (async () => {
      const { granted } = await MediaLibrary.getPermissionsAsync();
      if (!granted) {
        setState((s) => ({ ...s, loading: false, initialized: true, permissionGranted: false }));
        return;
      }

      const cache = await loadLibraryCache();
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
          initialized: true,
          scanProgress: 1,
          scanStatus: "",
          error: null,
          permissionGranted: true,
          fetchingArtAlbumIds: new Set(),
        });

        // Background rescan after cache display — skip art refetch on resume
        setTimeout(() => scan(true, cache), 2000);
      } else {
        // No cache — show scan view immediately, then start scanning
        setState((s) => ({
          ...s,
          initialized: true,
          permissionGranted: true,
          loading: true,
          scanProgress: 0,
        }));
        await scan(false, null);
        // First-ever scan — fetch album art immediately (bypasses TTL)
        firstScanRef.current = true;
      }
    })();

    // Silently rescan when app returns to foreground
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        scan(true, cacheRef.current);
      }
      appState.current = nextState;
    });

    return () => {
      cancelled.current = true;
      sub.remove();
    };
  }, []);

  // After the first-ever scan completes and tracks are loaded, fetch art immediately
  useEffect(() => {
    if (firstScanRef.current && !state.loading && state.tracks.length > 0) {
      firstScanRef.current = false;
      fetchMissingArt();
    }
  }, [state.loading, state.tracks.length]);

  return {
    ...state,
    requestPermission,
    refresh: () => scan(false, null),
    fetchMissingArt,
  };
}
