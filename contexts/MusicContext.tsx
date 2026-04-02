import React, { createContext, useContext, useEffect } from "react";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { usePlayer } from "@/contexts/PlayerContext";
import { Track, Album, Artist } from "@/types/music";

interface MusicContextType {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  loading: boolean;
  scanProgress: number;
  error: string | null;
  permissionGranted: boolean;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const library = useMediaLibrary();
  const { restoreFromLibrary } = usePlayer();

  // Once scan is complete, restore last session
  useEffect(() => {
    if (!library.loading && library.tracks.length > 0) {
      restoreFromLibrary(library.tracks);
    }
  }, [library.loading, library.tracks.length]);

  return (
    <MusicContext.Provider value={library}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
