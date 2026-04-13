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
  State,
  Capability,
  AppKilledPlaybackBehavior,
  RepeatMode,
} from "react-native-track-player";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track } from "@/types/music";
import { router, useSegments } from "expo-router";
import { pushNowPlayingAnimated } from "@/hooks/useNowPlayingNav";
import { playerActions } from "@/playerActions";

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
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  stop: () => void;
  seekTo: (seconds: number) => void;
  restoreFromLibrary: (allTracks: Track[]) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

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
  } catch {
    playerSetup = true;
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const segments = useSegments();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);

  const trackMapRef = useRef<Map<string, Track>>(new Map());
  const queueRef = useRef<Track[]>([]);
  const saveStateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  queueRef.current = queue;

  const isPlaying = playbackState.state === State.Playing;

  useEffect(() => {
    setupPlayer().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!activeTrack?.id) {
      setCurrentTrack(null);
      // Queue ended or player reset — dismiss now playing if it's open
      if (segments.includes("nowplaying" as never)) {
        router.back();
      }
      return;
    }
    const track = trackMapRef.current.get(activeTrack.id);
    if (track) {
      console.log(`[PLAYER] Now playing: "${track.title}" by ${track.artist}`);
      console.log(`[PLAYER]   album: "${track.album}" | albumArt: ${track.albumArt ? track.albumArt.substring(0, 80) + "..." : "null"}`);
      setCurrentTrack(track);
    }
  }, [activeTrack?.id]);

  // Update Bluetooth/lock screen artwork when track changes
  useEffect(() => {
    if (!currentTrack?.albumArt || !ready) return;
    TrackPlayer.updateNowPlayingMetadata({
      artwork: currentTrack.albumArt,
    }).catch(() => {});
  }, [currentTrack?.albumArt, ready]);

  // Persist position every 5s while playing
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const interval = setInterval(async () => {
      const progress = await TrackPlayer.getProgress();
      persistState(currentTrack.id, Math.round(progress.position * 1000), queueRef.current);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack?.id]);

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

  // ─── Master playback functions ─────────────────────────────────────────────

  const play = useCallback(() => {
    TrackPlayer.play();
  }, []);

  const pause = useCallback(() => {
    TrackPlayer.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      TrackPlayer.pause();
    } else {
      TrackPlayer.play();
    }
  }, [isPlaying]);

  const skipNext = useCallback(async () => {
    try { await TrackPlayer.skipToNext(); } catch {}
  }, []);

  const skipPrev = useCallback(async () => {
    const progress = await TrackPlayer.getProgress();
    if (progress.position > 5) {
      await TrackPlayer.seekTo(0);
    } else {
      try { await TrackPlayer.skipToPrevious(); } catch {}
    }
  }, []);

  const stop = useCallback(() => {
    TrackPlayer.reset();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    TrackPlayer.seekTo(seconds);
  }, []);

  const onQueueEnded = useCallback(() => {
    TrackPlayer.reset();
  }, []);

  const onDuck = useCallback((paused: boolean, permanent: boolean) => {
    if (permanent || paused) {
      TrackPlayer.pause();
    } else {
      TrackPlayer.play();
    }
  }, []);

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (!ready) return;

    const effectiveQueue = newQueue ?? queueRef.current;
    const trackIndex = effectiveQueue.findIndex((t) => t.id === track.id);
    const startIndex = trackIndex >= 0 ? trackIndex : 0;

    if (newQueue) {
      setQueue(newQueue);
      queueRef.current = newQueue;
      newQueue.forEach((t) => trackMapRef.current.set(t.id, t));
    } else {
      trackMapRef.current.set(track.id, track);
    }

    pushNowPlayingAnimated();

    await TrackPlayer.reset();
    await TrackPlayer.add(effectiveQueue.map(toRNTPTrack));
    await TrackPlayer.skip(startIndex);
    await TrackPlayer.play();

    persistState(track.id, 0, effectiveQueue);
  }, [ready, persistState]);

  const restoreFromLibrary = useCallback(async (allTracks: Track[]) => {
    if (restored || !ready) return;
    setRestored(true);

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

      await TrackPlayer.reset();
      await TrackPlayer.add(restoredQueue.map(toRNTPTrack));
      await TrackPlayer.skip(Math.max(0, trackIndex));

      if (saved.positionMs > 0) {
        setTimeout(() => TrackPlayer.seekTo(saved.positionMs / 1000), 400);
      }
    } catch {}
  }, [restored, ready]);

  // ─── Register master functions with the background service bridge ──────────
  useEffect(() => {
    playerActions.play = play;
    playerActions.pause = pause;
    playerActions.togglePlayPause = togglePlayPause;
    playerActions.skipNext = skipNext;
    playerActions.skipPrev = skipPrev;
    playerActions.stop = stop;
    playerActions.seekTo = seekTo;
    playerActions.onQueueEnded = onQueueEnded;
    playerActions.onDuck = onDuck;
  }, [play, pause, togglePlayPause, skipNext, skipPrev, stop, seekTo, onQueueEnded, onDuck]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        playTrack,
        play,
        pause,
        togglePlayPause,
        skipNext,
        skipPrev,
        stop,
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
