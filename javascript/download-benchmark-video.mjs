#!/usr/bin/env node
/**
 * Buy one TikTok benchmark video from PreTestAds for $0.50 USDC via x402.
 *
 * Browse the 76-ad library (curves, transcripts, scores are free to read):
 *   https://pretestads.com/tiktok-ad-benchmark-library
 *
 * Usage:
 *   EVM_PRIVATE_KEY=0x... node download-benchmark-video.mjs <ad_id> [out.mp4]
 */
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { payingFetch } from "./lib/pretestads.mjs";

const [adId, out = `${process.argv[2]}.mp4`] = process.argv.slice(2);
if (!adId) {
  console.error("Usage: EVM_PRIVATE_KEY=0x... node download-benchmark-video.mjs <ad_id> [out.mp4]");
  process.exit(1);
}

const base = process.env.PRETESTADS_BASE_URL ?? "https://pretestads.com";
const r = await payingFetch()(`${base}/api/benchmarks/${adId}/video`);
if (r.status !== 200) {
  console.error(`Payment failed (${r.status}): ${(await r.text()).slice(0, 300)}`);
  process.exit(1);
}
const { video_url } = await r.json();

const v = await fetch(video_url);
await pipeline(Readable.fromWeb(v.body), createWriteStream(out));
console.log(`Saved ${out}`);
