#!/usr/bin/env node
/**
 * Gemini agent (your GEMINI_API_KEY) with a PreTestAds score_ad tool.
 *
 * Usage:
 *   npm install @google/genai
 *   GEMINI_API_KEY=... EVM_PRIVATE_KEY=0x... \
 *     node gemini-agent.mjs "Score this ad and suggest improvements: https://example.com/ad.mp4"
 */
import { GoogleGenAI, Type } from "@google/genai";
import { scoreAd } from "./lib/pretestads.mjs";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-pro";

const scoreAdDecl = {
  name: "score_ad",
  description:
    "Score a video or image ad with PreTestAds' fMRI-trained neural model. " +
    "Costs $5.00 USDC (paid automatically via x402) and takes 5-8 minutes. " +
    "Returns a 0-100 percentile score vs 76 top TikTok ads, a weak/moderate/strong label, " +
    "hook strength, and a per-second engagement timeseries.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      media_url: { type: Type.STRING, description: "Public https URL of the ad (mp4/mov/avi/jpg/png/webp)" },
      window_seconds: { type: Type.INTEGER, description: "Scoring window: 3, 5, 15, 30, or 60 (default 15)" },
    },
    required: ["media_url"],
  },
};

const ai = new GoogleGenAI({}); // reads GEMINI_API_KEY
const contents = [
  { role: "user", parts: [{ text: process.argv.slice(2).join(" ") || "Score this ad: https://example.com/ad.mp4" }] },
];
const config = {
  systemInstruction: "You are an ad-creative analyst. Use the score_ad tool when asked to evaluate an ad, then interpret the results with concrete advice.",
  tools: [{ functionDeclarations: [scoreAdDecl] }],
};

for (;;) {
  const resp = await ai.models.generateContent({ model: MODEL, contents, config });
  const calls = resp.functionCalls ?? [];
  if (!calls.length) {
    console.log(resp.text);
    break;
  }
  contents.push(resp.candidates[0].content);
  for (const call of calls) {
    console.log(`[tool] score_ad(${call.args.media_url}) — paying $5 USDC via x402, then waiting...`);
    let result;
    try {
      result = await scoreAd(call.args.media_url, call.args.window_seconds ?? 15);
    } catch (e) {
      result = { error: String(e) };
    }
    contents.push({ role: "user", parts: [{ functionResponse: { name: call.name, response: { result } } }] });
  }
}
