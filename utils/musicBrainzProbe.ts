/**
 * musicBrainzProbe.ts
 *
 * Test utility — searches MusicBrainz for album info and cover art.
 * Tries the original title first, then strips common suffixes like
 * "- EP", "- Single", "(EP)", "(Single)" if the first search fails.
 */

const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org";
const USER_AGENT = "LightMusic/1.0 (dryane@example.com)";

/**
 * Strip common release-type suffixes from album titles.
 * Returns null if nothing was stripped.
 */
function stripReleaseSuffix(title: string): string | null {
  const stripped = title
    .replace(/\s*[-–]\s*(EP|Single)\s*$/i, "")
    .replace(/\s*\(\s*(EP|Single)\s*\)\s*$/i, "")
    .trim();
  console.log(`[MB] stripReleaseSuffix("${title}") → "${stripped}" changed=${stripped !== title}`);
  return stripped !== title ? stripped : null;
}

async function mbFetch(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    console.log(`[MB] HTTP ${res.status} for ${url}`);
    return null;
  }
  return res.json();
}

async function searchRelease(artistName: string, albumTitle: string) {
  const query = `release:"${albumTitle}" AND artist:"${artistName}"`;
  const searchUrl = `${MB_BASE}/release/?query=${encodeURIComponent(query)}&fmt=json&limit=5`;
  console.log(`[MB] Searching: "${albumTitle}"`);
  const data = await mbFetch(searchUrl);
  return data?.releases ?? [];
}

export async function probeMusicBrainz(
  artistName: string,
  albumTitle: string
): Promise<void> {
  console.log(`[MB] === "${artistName}" — "${albumTitle}" ===`);

  // Try original title
  let releases = await searchRelease(artistName, albumTitle);

  // If no results, try stripping suffix
  if (releases.length === 0) {
    const stripped = stripReleaseSuffix(albumTitle);
    if (stripped) {
      console.log(`[MB] No results, retrying without suffix: "${stripped}"`);
      await new Promise((r) => setTimeout(r, 1100)); // rate limit
      releases = await searchRelease(artistName, stripped);
    }
  }

  if (releases.length === 0) {
    console.log(`[MB] No releases found`);
    console.log(`[MB] === Done ===`);
    return;
  }

  console.log(`[MB] Found ${releases.length} release(s):`);

  for (let i = 0; i < Math.min(releases.length, 3); i++) {
    const release = releases[i];
    const mbid = release.id;
    const title = release.title;
    const artist = release["artist-credit"]?.[0]?.name ?? "unknown";
    const date = release.date ?? "no date";
    const country = release.country ?? "??";
    const score = release.score;
    const status = release.status ?? "unknown";

    console.log(`[MB] #${i + 1}: "${title}" by ${artist} (${date}, ${country}, score=${score}, status=${status})`);
    console.log(`[MB]   MBID: ${mbid}`);

    // Check Cover Art Archive
    const caaUrl = `${CAA_BASE}/release/${mbid}`;
    console.log(`[MB]   Checking cover art: ${caaUrl}`);

    try {
      const caaRes = await fetch(caaUrl, {
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });

      if (caaRes.ok) {
        const caaData = await caaRes.json();
        const images = caaData.images ?? [];
        console.log(`[MB]   Cover Art: ${images.length} image(s)`);

        for (const img of images) {
          const front = img.front ? "FRONT" : "";
          const types = (img.types ?? []).join(", ");
          const thumb250 = img.thumbnails?.["250"] ?? img.thumbnails?.small ?? "none";
          const thumb500 = img.thumbnails?.["500"] ?? img.thumbnails?.large ?? "none";
          const full = img.image ?? "none";
          console.log(`[MB]     ${front} [${types}]`);
          console.log(`[MB]       250px: ${thumb250}`);
          console.log(`[MB]       500px: ${thumb500}`);
          console.log(`[MB]       full:  ${full}`);
        }
      } else if (caaRes.status === 404) {
        console.log(`[MB]   No cover art available (404)`);
      } else {
        console.log(`[MB]   Cover Art Archive returned ${caaRes.status}`);
      }
    } catch (e) {
      console.log(`[MB]   Cover Art Archive error: ${e}`);
    }

    // MusicBrainz rate limit
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log(`[MB] === Done ===`);
}
