#!/usr/bin/env node
/**
 * Claude agent (your ANTHROPIC_API_KEY) with a PreTestAds score_ad tool.
 *
 * Usage:
 *   npm install @anthropic-ai/sdk
 *   ANTHROPIC_API_KEY=... EVM_PRIVATE_KEY=0x... \
 *     node anthropic-agent.mjs "Score this ad and suggest improvements: https://example.com/ad.mp4"
 */
import Anthropic from "@anthropic-ai/sdk";
import { scoreAd } from "./lib/pretestads.mjs";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

const tools = [{
  name: "score_ad",
  description:
    "Score a video or image ad with PreTestAds' fMRI-trained neural model. " +
    "Costs $5.00 USDC (paid automatically via x402) and takes 5-8 minutes. " +
    "Returns a 0-100 percentile score vs 76 top TikTok ads, a weak/moderate/strong label, " +
    "hook strength, and a per-second engagement timeseries.",
  input_schema: {
    type: "object",
    properties: {
      media_url: { type: "string", description: "Public https URL of the ad (mp4/mov/avi/jpg/png/webp)" },
      window_seconds: { type: "integer", enum: [3, 5, 15, 30, 60], description: "Scoring window (default 15)" },
    },
    required: ["media_url"],
  },
}];

const client = new Anthropic();
const messages = [
  { role: "user", content: process.argv.slice(2).join(" ") || "Score this ad: https://example.com/ad.mp4" },
];

for (;;) {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: "You are an ad-creative analyst. Use the score_ad tool when asked to evaluate an ad, then interpret the results with concrete advice.",
    tools,
    messages,
  });
  messages.push({ role: "assistant", content: resp.content });

  if (resp.stop_reason !== "tool_use") {
    console.log(resp.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
    break;
  }
  const results = [];
  for (const block of resp.content) {
    if (block.type !== "tool_use") continue;
    console.log(`[tool] score_ad(${block.input.media_url}) — paying $5 USDC via x402, then waiting...`);
    let result;
    try {
      result = await scoreAd(block.input.media_url, block.input.window_seconds ?? 15);
    } catch (e) {
      result = { error: String(e) };
    }
    results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
  }
  messages.push({ role: "user", content: results });
}
