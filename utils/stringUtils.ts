/**
 * String normalisation and fuzzy-matching utilities for the music library.
 */

/** Normalise punctuation and whitespace for display/storage. */
export function normalise(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");
}

/** Normalise to bare alphanumeric for fuzzy matching. */
export function normaliseForMatch(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

/**
 * Levenshtein-based similarity score in [0, 1].
 * 1 = identical, 0 = completely different.
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[a.length][b.length];
  return 1 - distance / Math.max(a.length, b.length);
}

/** Stable compound key for an album (artist + album name). */
export function albumKey(artist: string, album: string): string {
  return `${normalise(artist)}__${normalise(album)}`;
}

/** Stable key for an artist. */
export function artistKey(artist: string): string {
  return normalise(artist);
}

/** Filesystem-safe key (max 100 chars). */
export function safeFileKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, "_").substring(0, 100);
}

/** Returns true if a metadata string is effectively empty/unknown. */
export function isUnknown(val: string | null | undefined): boolean {
  if (!val) return true;
  const v = val.trim().toLowerCase();
  return v === "" || v === "unknown" || v === "unknown artist" || v === "unknown album";
}

/**
 * Attempt to extract "Artist - Title" from a raw filename.
 * Falls back to the full basename as title with "Unknown Artist".
 */
export function parseFilename(filename: string): { title: string; artist: string } {
  const name = filename.replace(/\.[^.]+$/, "");
  const parts = name.split(" - ");
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: "Unknown Artist", title: name.trim() };
}

export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp3":  return "audio/mpeg";
    case "m4a":  return "audio/mp4";
    case "aac":  return "audio/aac";
    case "flac": return "audio/flac";
    case "ogg":  return "audio/ogg";
    case "wav":  return "audio/wav";
    default:     return "audio/mpeg";
  }
}
