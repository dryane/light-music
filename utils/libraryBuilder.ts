/**
 * Builds Album and Artist collections from a flat Track array.
 *
 * - Albums are keyed by albumId (normalised albumArtist__album string).
 * - Artists are keyed by artistId (normalised albumArtist name).
 * - Unknown artists are excluded from the Artist list.
 * - Albums sort by releaseDate (full precision), then year, then title.
 * - Artists sort alphabetically, ignoring leading "The"/"A".
 * - Tracks within an album sort by trackNumber, then title.
 * - Album art is propagated to all tracks in the album.
 */

import { Track, Album, Artist } from "@/types/music";
import { isUnknown } from "@/utils/stringUtils";

/**
 * Compare two albums chronologically.
 * Uses releaseDate (ISO string) for full precision when available,
 * falls back to year, then title.
 */
function compareAlbumDates(a: Album, b: Album): number {
  // Both have releaseDate — compare as strings (ISO dates sort lexicographically)
  if (a.releaseDate && b.releaseDate) return a.releaseDate.localeCompare(b.releaseDate);
  // One has releaseDate, the other only year — compare year portions
  if (a.releaseDate && b.year) {
    const aYear = new Date(a.releaseDate).getFullYear();
    if (aYear !== b.year) return aYear - b.year;
    return -1; // a has more precision, sort it first within same year
  }
  if (b.releaseDate && a.year) {
    const bYear = new Date(b.releaseDate).getFullYear();
    if (a.year !== bYear) return a.year - bYear;
    return 1; // b has more precision, sort it first within same year
  }
  // Both only have year
  if (a.year && b.year) return a.year - b.year;
  if (a.year) return -1;
  if (b.year) return 1;
  return a.title.localeCompare(b.title);
}

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
        albumArtist: track.albumArtist,
        artistId: track.artistId,
        year: track.year,
        releaseDate: track.releaseDate,
        albumArt: track.albumArt,
        tracks: [],
      });
    }
    const alb = albumMap.get(track.albumId)!;
    alb.tracks.push(track);
    if (!alb.albumArt && track.albumArt) alb.albumArt = track.albumArt;
    if (track.year && (!alb.year || track.year < alb.year)) alb.year = track.year;
    // Use the earliest releaseDate found across tracks in the album
    if (track.releaseDate && (!alb.releaseDate || track.releaseDate < alb.releaseDate)) {
      alb.releaseDate = track.releaseDate;
    }
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
        name: alb.albumArtist,
        albums: [],
        trackCount: 0,
      });
    }
    const art = artistMap.get(alb.artistId)!;
    art.albums.push(alb);
    art.trackCount += alb.tracks.length;
  }

  for (const art of artistMap.values()) {
    art.albums.sort(compareAlbumDates);
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

  const sortedAlbums = Array.from(albumMap.values()).sort(compareAlbumDates);

  return { albums: sortedAlbums, artists: sortedArtists };
}
