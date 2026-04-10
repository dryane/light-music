import React, { createContext, useContext, useEffect } from "react";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { usePlayer } from "@/contexts/PlayerContext";
import { Track, Album, Artist } from "@/types/music";
import { useMemo } from "react";

interface MusicContextType {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  loading: boolean;
  scanProgress: number;
  scanStatus: string;
  error: string | null;
  permissionGranted: boolean;
  fetchingArtAlbumIds: Set<string>;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const library = useMediaLibrary();
  const { restoreFromLibrary } = usePlayer();
  console.log("[MUSIC] render", Date.now());

  // Once scan is complete, restore last session
  useEffect(() => {
    if (!library.loading && library.tracks.length > 0) {
      restoreFromLibrary(library.tracks);
    }
  }, [library.loading, library.tracks.length]);

const value = useMemo(() => ({
  ...library,
}), [
  library.tracks,
  library.albums,
  library.artists,
  library.loading,
  library.scanProgress,
  library.scanStatus,
  library.error,
  library.permissionGranted,
  library.requestPermission,
  library.refresh,
  // fetchingArtAlbumIds intentionally excluded — Set reference changes too often
]);

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
