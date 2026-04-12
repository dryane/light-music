export interface Track {
  id: string;
  title: string;
  artist: string;       // track-level artist (performer) — used in player UI
  albumArtist: string;  // album-level artist — used for library grouping
  artistId: string;     // normalised lowercase key (from albumArtist)
  album: string;
  albumId: string;      // normalised key
  albumArt: string | null; // base64 data URI or null
  duration: number;     // ms
  uri: string;
  year: number | null;
  releaseDate: string | null; // ISO date string e.g. "2013-12-06T08:00:00Z"
  trackNumber: number | null;
}

export interface Album {
  id: string;
  title: string;
  albumArtist: string;
  artistId: string;
  year: number | null;
  releaseDate: string | null; // ISO date string — from file tags or iTunes
  albumArt: string | null;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  albums: Album[];
  trackCount: number;
}
