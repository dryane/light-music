import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import TrackPlayer, {
  useActiveTrack,
  usePlaybackState,
  useProgress,
  State,
  Capability,
  AppKilledPlaybackBehavior,
  RepeatMode,
} from "react-native-track-player";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track } from "@/types/music";
import { router } from "expo-router";

const STORAGE_KEY = "player_state_v2";

interface SavedState {
  trackId: string;
  positionMs: number;
  queue: string[];
}

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  togglePlayPause: () => void;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  seekTo: (ms: number) => void;
  restoreFromLibrary: (allTracks: Track[]) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

// Convert our Track type to RNTP's track format
function toRNTPTrack(track: Track) {
  return {
    id: track.id,
    url: track.uri,
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: track.albumArt ?? undefined,
    duration: track.duration / 1000,
  };
}

let playerSetup = false;

async function setupPlayer() {
  if (playerSetup) return;
  try {
    await TrackPlayer.setupPlayer({
      minBuffer: 5,
      maxBuffer: 30,
      playBuffer: 2,
      backBuffer: 10,
    });
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
    });
    await TrackPlayer.setRepeatMode(RepeatMode.Off);
    playerSetup = true;
  } catch (e) {
    // Player already set up
    playerSetup = true;
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // RNTP hooks — these are the source of truth
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const progress = useProgress(500); // update every 500ms for persistence

  // Our Track type — mapped from RNTP's active track
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);

  // Keep a ref map of id -> Track so we can look up our full Track objects
  const trackMapRef = useRef<Map<string, Track>>(new Map());
  const queueRef = useRef<Track[]>([]);
  const saveStateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  queueRef.current = queue;

  const isPlaying = playbackState.state === State.Playing;
  const positionMs = Math.round(progress.position * 1000);
  const durationMs = Math.round(progress.duration * 1000);

  // Setup RNTP on mount
  useEffect(() => {
    setupPlayer().then(() => setReady(true));
  }, []);

  // Sync RNTP active track to our Track type
  useEffect(() => {
    if (!activeTrack?.id) {
      setCurrentTrack(null);
      return;
    }
    const track = trackMapRef.current.get(activeTrack.id);
    if (track) setCurrentTrack(track);
  }, [activeTrack?.id]);

  // Persist position every 5s while playing
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const interval = setInterval(() => {
      persistState(currentTrack.id, positionMs, queueRef.current);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack?.id, positionMs]);

  const persistState = useCallback((trackId: string, posMs: number, q: Track[]) => {
    if (saveStateRef.current) clearTimeout(saveStateRef.current);
    saveStateRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          trackId,
          positionMs: posMs,
          queue: q.map((t) => t.id),
        } as SavedState));
      } catch {}
    }, 1000);
  }, []);

  // ─── Playback methods ─────────────────────────────────────────────────────

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (!ready) return;

    const effectiveQueue = newQueue ?? queueRef.current;
    const trackIndex = effectiveQueue.findIndex((t) => t.id === track.id);
    const startIndex = trackIndex >= 0 ? trackIndex : 0;

    // Update our local queue state
    if (newQueue) {
      setQueue(newQueue);
      queueRef.current = newQueue;
      // Register all tracks in the map
      newQueue.forEach((t) => trackMapRef.current.set(t.id, t));
    } else {
      trackMapRef.current.set(track.id, track);
    }

    router.push("/nowplaying");

    // Load the queue into RNTP
    await TrackPlayer.reset();
    await TrackPlayer.add(effectiveQueue.map(toRNTPTrack));
    await TrackPlayer.skip(startIndex);
    await TrackPlayer.play();

    persistState(track.id, 0, effectiveQueue);
  }, [ready, persistState]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      TrackPlayer.pause();
    } else {
      TrackPlayer.play();
    }
  }, [isPlaying]);

  const skipNext = useCallback(async () => {
    try {
      await TrackPlayer.skipToNext();
    } catch {}
  }, []);

  const skipPrev = useCallback(async () => {
    if (positionMs > 3000) {
      await TrackPlayer.seekTo(0);
      return;
    }
    try {
      await TrackPlayer.skipToPrevious();
    } catch {}
  }, [positionMs]);

  const seekTo = useCallback((ms: number) => {
    TrackPlayer.seekTo(ms / 1000);
  }, []);

  // Restore last session once library loads
  const restoreFromLibrary = useCallback(async (allTracks: Track[]) => {
    if (restored || !ready) return;
    setRestored(true);

    // Register all tracks in the map
    allTracks.forEach((t) => trackMapRef.current.set(t.id, t));

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved: SavedState = JSON.parse(raw);

      const track = allTracks.find((t) => t.id === saved.trackId);
      if (!track) return;

      const restoredQueue = saved.queue
        .map((id) => allTracks.find((t) => t.id === id))
        .filter(Boolean) as Track[];
      if (restoredQueue.length === 0) return;

      const trackIndex = restoredQueue.findIndex((t) => t.id === track.id);

      setQueue(restoredQueue);
      queueRef.current = restoredQueue;
      setCurrentTrack(track);

      // Load into RNTP but don't auto-play
      await TrackPlayer.reset();
      await TrackPlayer.add(restoredQueue.map(toRNTPTrack));
      await TrackPlayer.skip(Math.max(0, trackIndex));

      if (saved.positionMs > 0) {
        setTimeout(() => TrackPlayer.seekTo(saved.positionMs / 1000), 400);
      }
    } catch {}
  }, [restored, ready]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        positionMs,
        durationMs,
        playTrack,
        togglePlayPause,
        skipNext,
        skipPrev,
        seekTo,
        restoreFromLibrary,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
