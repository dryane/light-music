export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string; // normalised lowercase key
  album: string;
  albumId: string;  // normalised key
  albumArt: string | null; // base64 data URI or null
  duration: number; // ms
  uri: string;
  year: number | null;
  trackNumber: number | null;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  year: number | null;
  albumArt: string | null;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  albums: Album[];
  trackCount: number;
}
