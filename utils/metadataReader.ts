/**
 * Audio file metadata extraction via music-metadata + react-native-fs.
 *
 * Uses progressive partial reads (64KB → 256KB → full) to avoid loading
 * entire audio files into JS memory just to read header tags.
 *
 * Falls back to filename parsing if the file can't be read or has no tags.
 */

import RNFS from "react-native-fs";
import { parseBuffer, selectCover } from "music-metadata";
import { parseFilename, getMimeType, isUnknown } from "@/utils/stringUtils";

// Set to true to extract embedded cover art from audio files.
// Keep false for Light Phone — it corrupts embedded art during transcoding.
const USE_EMBEDDED_ART = false;

// Progressive read sizes — covers all tested file formats
const CHUNK_SIZES = [
  64 * 1024,   // 64KB — works for most mp3/m4a files
  256 * 1024,  // 256KB — covers files with large embedded art pushing tags deeper
];

export interface TrackMetadata {
  title: string;
  artist: string;       // track-level performer (common.artist)
  albumArtist: string;  // album-level artist (common.albumartist → common.artist → filename)
  album: string;
  albumArtBase64: string | null;
  year: number | null;
  trackNumber: number | null;
}

function uriToPath(uri: string): string {
  if (uri.startsWith("file://")) return uri.replace("file://", "");
  return uri;
}

function base64ToBuffer(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const buffer = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    buffer[i] = binaryStr.charCodeAt(i);
  }
  return buffer;
}

/**
 * Attempt to parse metadata from a buffer.
 * Returns the common metadata if essential fields are found, null otherwise.
 */
async function tryParse(
  buffer: Uint8Array,
  mimeType: string,
  fileSize: number
) {
  try {
    const metadata = await parseBuffer(buffer, { mimeType, size: fileSize });
    const { common } = metadata;
    // Consider it complete if we have at least title + some artist + album
    const hasEssentials = !!(
      common.title &&
      (common.artist || common.albumartist) &&
      common.album
    );
    if (hasEssentials) return common;
    return null;
  } catch {
    // EndOfStreamError or parse failure — need more data
    return null;
  }
}

/**
 * Read and parse metadata from an audio file URI.
 * Uses progressive partial reads for speed.
 * Never throws — returns a best-effort result using filename fallback.
 */
export async function readMetadata(
  uri: string,
  filename: string
): Promise<TrackMetadata> {
  const fallback = parseFilename(filename);
  const mimeType = getMimeType(filename);
  const path = uriToPath(uri);

  try {
    // Get file size for the parser (it uses this for format detection)
    const stat = await RNFS.stat(path);
    const fileSize = Number(stat.size);

    let common = null;

    // Try progressive partial reads
    for (const chunkSize of CHUNK_SIZES) {
      if (chunkSize >= fileSize) break; // No point reading a chunk larger than the file

      const base64 = await RNFS.read(path, chunkSize, 0, "base64");
      const buffer = base64ToBuffer(base64);
      common = await tryParse(buffer, mimeType, fileSize);
      if (common) break;
    }

    // If partial reads didn't work, read the full file
    if (!common) {
      const base64 = await RNFS.readFile(path, "base64");
      const buffer = base64ToBuffer(base64);
      common = await tryParse(buffer, mimeType, fileSize);
    }

    if (!common) {
      // Parser couldn't extract anything — use filename fallback
      return {
        title: fallback.title,
        artist: fallback.artist,
        albumArtist: fallback.artist,
        album: "Unknown Album",
        albumArtBase64: null,
        year: null,
        trackNumber: null,
      };
    }

    const title = common.title?.trim() || fallback.title;

    const albumArtist =
      (!isUnknown(common.albumartist) ? common.albumartist?.trim() : null) ||
      (!isUnknown(common.artist) ? common.artist?.trim() : null) ||
      fallback.artist;

    const artist =
      (!isUnknown(common.artist) ? common.artist?.trim() : null) ||
      albumArtist;

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

    return { title, artist, albumArtist, album, albumArtBase64, year, trackNumber };
  } catch {
    return {
      title: fallback.title,
      artist: fallback.artist,
      albumArtist: fallback.artist,
      album: "Unknown Album",
      albumArtBase64: null,
      year: null,
      trackNumber: null,
    };
  }
}
