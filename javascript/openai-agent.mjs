#!/usr/bin/env node
/**
 * OpenAI agent (your OPENAI_API_KEY) with a PreTestAds score_ad tool.
 *
 * Usage:
 *   npm install openai
 *   OPENAI_API_KEY=sk-... EVM_PRIVATE_KEY=0x... \
 *     node openai-agent.mjs "Score this ad and suggest improvements: https://example.com/ad.mp4"
 */
import OpenAI from "openai";
import { scoreAd } from "./lib/pretestads.mjs";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

const tools = [{
  type: "function",
  function: {
    name: "score_ad",
    description:
      "Score a video or image ad with PreTestAds' fMRI-trained neural model. " +
      "Costs $5.00 USDC (paid automatically via x402) and takes 5-8 minutes. " +
      "Returns a 0-100 percentile score vs 76 top TikTok ads, a weak/moderate/strong label, " +
      "hook strength, and a per-second engagement timeseries.",
    parameters: {
      type: "object",
      properties: {
        media_url: { type: "string", description: "Public https URL of the ad (mp4/mov/avi/jpg/png/webp)" },
        window_seconds: { type: "integer", enum: [3, 5, 15, 30, 60], description: "Scoring window (default 15)" },
      },
      required: ["media_url"],
    },
  },
}];

const client = new OpenAI();
const messages = [
  { role: "system", content: "You are an ad-creative analyst. Use the score_ad tool when asked to evaluate an ad, then interpret the results with concrete advice." },
  { role: "user", content: process.argv.slice(2).join(" ") || "Score this ad: https://example.com/ad.mp4" },
];

for (;;) {
  const resp = await client.chat.completions.create({ model: MODEL, messages, tools });
  const msg = resp.choices[0].message;
  messages.push(msg);

  if (!msg.tool_calls?.length) {
    console.log(msg.content);
    break;
  }
  for (const call of msg.tool_calls) {
    const args = JSON.parse(call.function.arguments);
    console.log(`[tool] score_ad(${args.media_url}) — paying $5 USDC via x402, then waiting...`);
    let result;
    try {
      result = await scoreAd(args.media_url, args.window_seconds ?? 15);
    } catch (e) {
      result = { error: String(e) };
    }
    messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
  }
}
