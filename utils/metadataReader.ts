/**
 * Audio file metadata extraction via music-metadata.
 *
 * Reads the file as base64, converts to Uint8Array, and parses ID3/MP4/FLAC
 * tags. Falls back to filename parsing if the file can't be read or has no tags.
 *
 * NOTE: USE_EMBEDDED_ART is intentionally false for Light Phone targets — the
 * device transcoder strips/corrupts embedded art during sync.
 */

import { readAsStringAsync } from "expo-file-system/legacy";
import { parseBuffer, selectCover } from "music-metadata";
import { parseFilename, getMimeType, isUnknown } from "@/utils/stringUtils";

// Set to true to extract embedded cover art from audio files.
// Keep false for Light Phone — it corrupts embedded art during transcoding.
const USE_EMBEDDED_ART = false;

export interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  albumArtBase64: string | null;
  year: number | null;
  trackNumber: number | null;
}

/**
 * Read and parse metadata from an audio file URI.
 * Never throws — returns a best-effort result using filename fallback.
 */
export async function readMetadata(
  uri: string,
  filename: string
): Promise<TrackMetadata> {
  const fallback = parseFilename(filename);

  try {
    const base64 = await readAsStringAsync(uri, {
      encoding: "base64" as any,
    });

    const binaryStr = atob(base64);
    const buffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      buffer[i] = binaryStr.charCodeAt(i);
    }

    const metadata = await parseBuffer(buffer, {
      mimeType: getMimeType(filename),
      size: buffer.length,
    });

    const { common } = metadata;
    const title = common.title?.trim() || fallback.title;
    const artist =
      (!isUnknown(common.albumartist) ? common.albumartist?.trim() : null) ||
      (!isUnknown(common.artist) ? common.artist?.trim() : null) ||
      fallback.artist;
    const album =
      (!isUnknown(common.album) ? common.album?.trim() : null) ||
      "Unknown Album";
    const year = common.year ?? null;
    const trackNumber = common.track?.no ?? null;

    let albumArtBase64: string | null = null;
    if (USE_EMBEDDED_ART) {
      const cover = selectCover(common.picture);
      if (cover) {
        const b64 = btoa(
          Array.from(cover.data)
            .map((b) => String.fromCharCode(b))
            .join("")
        );
        albumArtBase64 = `data:${cover.format};base64,${b64}`;
      }
    }

    return { title, artist, album, albumArtBase64, year, trackNumber };
  } catch {
    return {
      title: fallback.title,
      artist: fallback.artist,
      album: "Unknown Album",
      albumArtBase64: null,
      year: null,
      trackNumber: null,
    };
  }
}
