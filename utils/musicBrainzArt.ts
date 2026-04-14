/**
 * MusicBrainz + Cover Art Archive integration for album art lookup.
 *
 * Used as a fallback when iTunes doesn't have art for an album.
 *
 * Strategy:
 *  1. Search MusicBrainz for the release by artist + album title.
 *  2. If no results and the title has a suffix like "- EP" or "- Single", retry without it.
 *  3. Fetch the front cover from Cover Art Archive using the release MBID.
 *  4. Prefer 500px thumbnail, fall back to 250px.
 *
 * Rate limit: MusicBrainz requires max 1 request per second.
 */

import { normaliseForMatch, similarity } from "@/utils/stringUtils";

const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org";
const USER_AGENT = "LightMusic/1.0";

const MIN_SCORE = 0.7;

export interface MBResult {
  artUrl: string | null;
  releaseDate: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripReleaseSuffix(title: string): string | null {
  const stripped = title
    .replace(/\s*[-–]\s*(EP|Single)\s*$/i, "")
    .replace(/\s*\(\s*(EP|Single)\s*\)\s*$/i, "")
    .trim();
  return stripped !== title ? stripped : null;
}

async function mbFetch(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function rateLimitDelay(): Promise<void> {
  await new Promise<void>((r) => setTimeout(r, 1100));
}

// ─── Search + Art ─────────────────────────────────────────────────────────────

async function searchReleases(
  artistName: string,
  albumTitle: string
): Promise<any[]> {
  const query = `release:"${albumTitle}" AND artist:"${artistName}"`;
  const url = `${MB_BASE}/release/?query=${encodeURIComponent(query)}&fmt=json&limit=10`;
  const data = await mbFetch(url);
  return data?.releases ?? [];
}

async function fetchCoverArtUrl(mbid: string): Promise<string | null> {
  try {
    const res = await fetch(`${CAA_BASE}/release/${mbid}`, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    if (!res.ok) return null;

    const data = await res.json();
    const images = data.images ?? [];
    // Prefer front cover
    const front = images.find((img: any) => img.front) ?? images[0];
    if (!front) return null;

    const url = front.thumbnails?.["500"] ??
      front.thumbnails?.large ??
      front.thumbnails?.["250"] ??
      front.thumbnails?.small ??
      front.image ??
      null;

    // Cover Art Archive sometimes returns http:// URLs — force HTTPS
    return url?.replace(/^http:\/\//, "https://") ?? null;
  } catch {
    return null;
  }
}

/**
 * Find the best matching release from a list of MusicBrainz results.
 * Uses normalised fuzzy matching against the album title.
 */
function findBestRelease(
  releases: any[],
  albumTitle: string
): any | null {
  const normTarget = normaliseForMatch(albumTitle);
  let bestRelease = null;
  let bestScore = MIN_SCORE;

  for (const release of releases) {
    const normRelease = normaliseForMatch(release.title ?? "");
    const score = similarity(normTarget, normRelease);
    if (score > bestScore) {
      bestScore = score;
      bestRelease = release;
    }
  }

  return bestRelease;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search MusicBrainz for a single album and return art URL + release date.
 * Handles suffix stripping ("- EP", "- Single") as a fallback.
 * Respects MusicBrainz rate limits internally.
 */
export async function fetchArtFromMusicBrainz(
  artistName: string,
  albumTitle: string
): Promise<MBResult> {
  // Try original title
  let releases = await searchReleases(artistName, albumTitle);

  // Fallback: strip suffix and retry
  if (releases.length === 0) {
    const stripped = stripReleaseSuffix(albumTitle);
    if (stripped) {
      await rateLimitDelay();
      releases = await searchReleases(artistName, stripped);
    }
  }

  if (releases.length === 0) {
    return { artUrl: null, releaseDate: null };
  }

  // Find best match
  const bestRelease = findBestRelease(releases, albumTitle)
    ?? findBestRelease(releases, stripReleaseSuffix(albumTitle) ?? albumTitle);

  if (!bestRelease) {
    return { artUrl: null, releaseDate: null };
  }

  const releaseDate = bestRelease.date ?? null;

  // Fetch cover art
  await rateLimitDelay();
  const artUrl = await fetchCoverArtUrl(bestRelease.id);

  return { artUrl, releaseDate };
}

/**
 * Batch fetch art for multiple albums from a single artist.
 * Returns a map of albumKey → MBResult.
 * Respects MusicBrainz rate limits between requests.
 */
export async function fetchArtForArtistFromMB(
  artistName: string,
  albums: { aKey: string; title: string }[]
): Promise<Map<string, MBResult>> {
  const results = new Map<string, MBResult>();

  for (const album of albums) {
    const result = await fetchArtFromMusicBrainz(artistName, album.title);
    if (result.artUrl || result.releaseDate) {
      results.set(album.aKey, result);
    }
    await rateLimitDelay();
  }

  return results;
}
