#!/usr/bin/env node
/**
 * Score an ad with PreTestAds — plain x402 agent, no LLM, no account.
 *
 * Usage:
 *   npm install
 *   EVM_PRIVATE_KEY=0x... node score-ad.mjs https://example.com/ad.mp4 [windowSeconds]
 *
 * Costs $5.00 USDC on Base per run. Result in ~5-8 minutes.
 */
import { scoreAd } from "./lib/pretestads.mjs";

const [media, window = "15"] = process.argv.slice(2);
if (!media) {
  console.error("Usage: EVM_PRIVATE_KEY=0x... node score-ad.mjs <media_url_or_file> [3|5|15|30|60]");
  process.exit(1);
}

const result = await scoreAd(media, Number(window));
console.log(JSON.stringify(result, null, 2));
if (result.status === "complete") {
  console.log(`\nScore: ${result.score}/100 — ${result.label}`);
}
