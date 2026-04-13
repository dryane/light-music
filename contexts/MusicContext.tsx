import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { usePlayer } from "@/contexts/PlayerContext";
import { Track, Album, Artist } from "@/types/music";

interface MusicContextType {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  loading: boolean;
  initialized: boolean;
  scanProgress: number;
  scanStatus: string;
  error: string | null;
  permissionGranted: boolean;
  fetchingArtAlbumIds: Set<string>;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchMissingArt: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const library = useMediaLibrary();
  const { restoreFromLibrary } = usePlayer();

  // Once the initial scan completes, restore last playback session
  useEffect(() => {
    if (!library.loading && library.tracks.length > 0) {
      restoreFromLibrary(library.tracks);
    }
  }, [library.loading, library.tracks.length]);

  const value = useMemo<MusicContextType>(
    () => ({
      tracks: library.tracks,
      albums: library.albums,
      artists: library.artists,
      loading: library.loading,
      initialized: library.initialized,
      scanProgress: library.scanProgress,
      scanStatus: library.scanStatus,
      error: library.error,
      permissionGranted: library.permissionGranted,
      fetchingArtAlbumIds: library.fetchingArtAlbumIds,
      requestPermission: library.requestPermission,
      refresh: library.refresh,
      fetchMissingArt: library.fetchMissingArt,
    }),
    [
      library.tracks,
      library.albums,
      library.artists,
      library.loading,
      library.initialized,
      library.scanProgress,
      library.scanStatus,
      library.error,
      library.permissionGranted,
      library.fetchingArtAlbumIds,
      library.requestPermission,
      library.refresh,
      library.fetchMissingArt,
    ]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
