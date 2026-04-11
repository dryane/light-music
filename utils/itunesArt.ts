/**
 * iTunes Search API integration for album art lookup.
 *
 * Strategy:
 *  1. Fetch all albums for an artist via artistId lookup.
 *  2. Build a score matrix between local albums and iTunes collections.
 *  3. Greedily assign best matches above MIN_SCORE (one-to-one).
 *  4. Prefer 512px artwork, fall back to 100px.
 */

import { normaliseForMatch, similarity } from "@/utils/stringUtils";

/** Minimum Levenshtein similarity to accept an album art match. */
const MIN_SCORE = 0.7;

interface ItunesCollection {
  collectionName: string;
  artworkUrl100: string;
  artworkUrl512: string;
  _assigned: boolean;
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchArtistCollections(
  artistName: string
): Promise<ItunesCollection[]> {
  try {
    const searchRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=1`
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const artistId = searchData.results?.[0]?.artistId;
    if (!artistId) return [];

    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=200`
    );
    if (!res.ok) return [];
    const data = await res.json();

    return data.results
      .filter((r: any) => r.wrapperType === "collection")
      .map((r: any) => ({
        collectionName: r.collectionName,
        artworkUrl100: r.artworkUrl100,
        artworkUrl512:
          r.artworkUrl100?.replace("100x100bb", "512x512bb") ?? r.artworkUrl100,
        _assigned: false,
      }));
  } catch {
    return [];
  }
}

async function resolveArtUrl(
  collection: ItunesCollection
): Promise<string | null> {
  try {
    const res = await fetch(collection.artworkUrl512, { method: "HEAD" });
    if (res.ok) return collection.artworkUrl512;
  } catch {}
  return collection.artworkUrl100 ?? null;
}

// ─── Matching ─────────────────────────────────────────────────────────────────

/**
 * Greedy best-first matching: returns a map of albumKey → art URL.
 * Each local album and each iTunes collection is assigned at most once.
 */
async function matchAlbumsToCollections(
  albums: { aKey: string; title: string }[],
  collections: ItunesCollection[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (albums.length === 0 || collections.length === 0) return result;

  const normAlbums = albums.map((a) => normaliseForMatch(a.title));
  const normCollections = collections.map((c) =>
    normaliseForMatch(c.collectionName)
  );

  const scoreMatrix: {
    albumIndex: number;
    collectionIndex: number;
    score: number;
  }[] = [];

  for (let ai = 0; ai < normAlbums.length; ai++) {
    for (let ci = 0; ci < normCollections.length; ci++) {
      const score = similarity(normAlbums[ai], normCollections[ci]);
      if (score >= MIN_SCORE) {
        scoreMatrix.push({ albumIndex: ai, collectionIndex: ci, score });
      }
    }
  }

  scoreMatrix.sort((a, b) => b.score - a.score);

  const assignedAlbums = new Set<number>();
  const assignedCollections = new Set<number>();

  for (const match of scoreMatrix) {
    if (assignedAlbums.has(match.albumIndex)) continue;
    if (assignedCollections.has(match.collectionIndex)) continue;

    assignedAlbums.add(match.albumIndex);
    assignedCollections.add(match.collectionIndex);

    const collection = collections[match.collectionIndex];
    collection._assigned = true;

    const url = await resolveArtUrl(collection);
    if (url) {
      result.set(albums[match.albumIndex].aKey, url);
    }
  }

  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * For a given artist, fetch iTunes collections and return a map of
 * albumKey → resolved art URL for every album that matched above MIN_SCORE.
 */
export async function fetchArtForArtist(
  artistName: string,
  albums: { aKey: string; title: string }[]
): Promise<Map<string, string>> {
  const collections = await fetchArtistCollections(artistName);
  return matchAlbumsToCollections(albums, collections);
}
