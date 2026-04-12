/**
 * metadataProbe.ts
 *
 * Test utility — probes a file using partial reads via react-native-fs
 * at increasing chunk sizes to find the minimum bytes needed.
 *
 * Usage:
 *   import { probeMetadata } from "@/utils/metadataProbe";
 *   probeMetadata(asset.uri, asset.filename);
 */

import RNFS from "react-native-fs";
import { parseBuffer } from "music-metadata";
import { getMimeType, isUnknown } from "@/utils/stringUtils";

const CHUNK_SIZES = [
  16 * 1024,    // 16KB
  32 * 1024,    // 32KB
  64 * 1024,    // 64KB
  128 * 1024,   // 128KB
  256 * 1024,   // 256KB
  512 * 1024,   // 512KB
];

function uriToPath(uri: string): string {
  // content:// URIs won't work with RNFS.read — we need a file:// path
  // expo-media-library returns content:// URIs on Android
  // RNFS can handle file:// paths directly
  if (uri.startsWith("file://")) return uri.replace("file://", "");
  return uri;
}

export async function probeMetadata(uri: string, filename: string): Promise<void> {
  const mimeType = getMimeType(filename);
  const path = uriToPath(uri);

  // Get file size
  let fileSize = 0;
  try {
    const stat = await RNFS.stat(path);
    fileSize = Number(stat.size);
    console.log(`[PROBE] File: ${filename} (${(fileSize / 1024).toFixed(0)}KB, ${mimeType})`);
  } catch (e) {
    console.log(`[PROBE] RNFS.stat failed for ${filename}: ${e}`);
    console.log(`[PROBE] path was: ${path}`);
    console.log(`[PROBE] original uri: ${uri}`);
    return;
  }

  // Full file read via RNFS for comparison
  console.log(`[PROBE] Reading full file via RNFS...`);
  const fullStart = Date.now();
  let fullBase64: string;
  try {
    fullBase64 = await RNFS.readFile(path, "base64");
  } catch (e) {
    console.log(`[PROBE] RNFS.readFile failed: ${e}`);
    return;
  }
  const fullReadTime = Date.now() - fullStart;

  const fullBinaryStr = atob(fullBase64);
  const fullBuffer = new Uint8Array(fullBinaryStr.length);
  for (let i = 0; i < fullBinaryStr.length; i++) {
    fullBuffer[i] = fullBinaryStr.charCodeAt(i);
  }

  const fullParseStart = Date.now();
  let fullMeta;
  try {
    fullMeta = await parseBuffer(fullBuffer, { mimeType, size: fullBuffer.length });
  } catch (e) {
    console.log(`[PROBE] Failed to parse full file: ${e}`);
    return;
  }
  const fullParseTime = Date.now() - fullParseStart;

  const full = fullMeta.common;
  console.log(`[PROBE] FULL (${(fullBuffer.length / 1024).toFixed(0)}KB) read=${fullReadTime}ms parse=${fullParseTime}ms`);
  console.log(`[PROBE]   title="${full.title}" artist="${full.artist}" albumartist="${full.albumartist}" album="${full.album}"`);
  console.log(`[PROBE]   year=${full.year} track=${full.track?.no}`);
  console.log(`[PROBE] ---`);

  // Test partial reads via RNFS.read
  for (const chunkSize of CHUNK_SIZES) {
    if (chunkSize >= fileSize) {
      console.log(`[PROBE] ${formatSize(chunkSize)} — skipped (larger than file)`);
      break;
    }

    const readStart = Date.now();
    let chunkBase64: string;
    try {
      chunkBase64 = await RNFS.read(path, chunkSize, 0, "base64");
    } catch (e) {
      console.log(`[PROBE] ${formatSize(chunkSize)} — RNFS.read failed: ${e}`);
      continue;
    }
    const readTime = Date.now() - readStart;

    const binaryStr = atob(chunkBase64);
    const buffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      buffer[i] = binaryStr.charCodeAt(i);
    }

    const parseStart = Date.now();
    let meta;
    try {
      meta = await parseBuffer(buffer, { mimeType, size: fileSize });
    } catch (e) {
      console.log(`[PROBE] ${formatSize(chunkSize)} — read=${readTime}ms parse failed: ${e}`);
      continue;
    }
    const parseTime = Date.now() - parseStart;

    const c = meta.common;
    const complete = !!(c.title && (c.artist || c.albumartist) && c.album);

    console.log(`[PROBE] ${formatSize(chunkSize)} read=${readTime}ms parse=${parseTime}ms complete=${complete}`);
    console.log(`[PROBE]   title="${c.title}" artist="${c.artist}" albumartist="${c.albumartist}" album="${c.album}"`);
    console.log(`[PROBE]   year=${c.year} track=${c.track?.no}`);

    if (complete && c.title === full.title && c.artist === full.artist && c.albumartist === full.albumartist && c.album === full.album) {
      console.log(`[PROBE]   ✓ Matches full parse`);
    } else if (complete) {
      console.log(`[PROBE]   ~ Complete but differs from full parse`);
    } else {
      console.log(`[PROBE]   ✗ Missing essential metadata`);
    }
  }

  console.log(`[PROBE] === Done: ${filename} ===`);
}

export async function probeMultiple(
  assets: { uri: string; filename: string }[],
  maxFiles = 5
): Promise<void> {
  const sample = assets.slice(0, maxFiles);
  console.log(`[PROBE] Testing ${sample.length} of ${assets.length} files (using RNFS partial reads)`);
  for (const asset of sample) {
    await probeMetadata(asset.uri, asset.filename);
    console.log("");
  }
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
  return `${(bytes / 1024).toFixed(0)}KB`;
}
