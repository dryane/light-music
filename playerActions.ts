/**
 * playerActions.ts
 *
 * Bridge between the RNTP background service (non-React) and PlayerContext (React).
 *
 * PlayerContext registers its master functions here on mount.
 * service.ts calls them via the exported `playerActions` object.
 * This ensures all playback logic lives in one place (PlayerContext)
 * while the background service can still reach it.
 */

export interface PlayerActions {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  stop: () => void;
  seekTo: (seconds: number) => void;
  onQueueEnded: () => void;
  onDuck: (paused: boolean, permanent: boolean) => void;
}

// Starts as no-ops — PlayerContext overwrites these on mount
export const playerActions: PlayerActions = {
  play: () => {},
  pause: () => {},
  togglePlayPause: () => {},
  skipNext: async () => {},
  skipPrev: async () => {},
  stop: () => {},
  seekTo: () => {},
  onQueueEnded: () => {},
  onDuck: () => {},
};
