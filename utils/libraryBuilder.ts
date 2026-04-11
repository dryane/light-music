/**
 * Builds Album and Artist collections from a flat Track array.
 *
 * - Albums are keyed by albumId (normalised artist__album string).
 * - Artists are keyed by artistId (normalised artist name).
 * - Unknown artists are excluded from the Artist list.
 * - Albums sort by year ascending, then title.
 * - Artists sort alphabetically, ignoring leading "The"/"A".
 * - Tracks within an album sort by trackNumber, then title.
 * - Album art is propagated to all tracks in the album.
 */

import { Track, Album, Artist } from "@/types/music";
import { isUnknown } from "@/utils/stringUtils";

export function buildLibrary(tracks: Track[]): {
  albums: Album[];
  artists: Artist[];
} {
  // ── Build album map ──────────────────────────────────────────────────────
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
    // Sort tracks by track number, then title
    alb.tracks.sort((a, b) => {
      if (a.trackNumber && b.trackNumber) return a.trackNumber - b.trackNumber;
      if (a.trackNumber) return -1;
      if (b.trackNumber) return 1;
      return a.title.localeCompare(b.title);
    });

    // Propagate album art to all tracks in the album
    if (alb.albumArt) {
      for (const t of alb.tracks) t.albumArt = alb.albumArt;
    }
  }

  // ── Build artist map ─────────────────────────────────────────────────────
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

  // Exclude unknown artists from the browse list
  for (const [key, artist] of artistMap.entries()) {
    if (isUnknown(artist.name)) artistMap.delete(key);
  }

  // ── Sort outputs ─────────────────────────────────────────────────────────
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
