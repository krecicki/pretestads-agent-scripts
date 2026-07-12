#!/usr/bin/env node
/**
 * Vercel AI SDK tool for PreTestAds ad scoring — works with any AI SDK provider
 * (OpenAI, Anthropic, Google, xAI...). Uses your provider API key.
 *
 * Usage:
 *   npm install ai @ai-sdk/openai zod
 *   OPENAI_API_KEY=sk-... EVM_PRIVATE_KEY=0x... \
 *     node vercel-ai-tool.mjs "Score this ad and suggest improvements: https://example.com/ad.mp4"
 */
import { generateText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { scoreAd } from "./lib/pretestads.mjs";

export const scoreAdTool = tool({
  description:
    "Score a video or image ad with PreTestAds' fMRI-trained neural model. " +
    "Costs $5.00 USDC (paid automatically via x402) and takes 5-8 minutes. " +
    "Returns a 0-100 percentile score vs 76 top TikTok ads, a weak/moderate/strong label, " +
    "hook strength, and a per-second engagement timeseries.",
  inputSchema: z.object({
    media_url: z.string().describe("Public https URL of the ad (mp4/mov/avi/jpg/png/webp)"),
    window_seconds: z.number().optional().describe("Scoring window: 3, 5, 15, 30, or 60 (default 15)"),
  }),
  execute: async ({ media_url, window_seconds }) => {
    console.log(`[tool] score_ad(${media_url}) — paying $5 USDC via x402, then waiting...`);
    return scoreAd(media_url, window_seconds ?? 15);
  },
});

const { text } = await generateText({
  model: openai(process.env.OPENAI_MODEL ?? "gpt-4o"),
  system: "You are an ad-creative analyst. Use the score_ad tool when asked to evaluate an ad, then interpret the results with concrete advice.",
  prompt: process.argv.slice(2).join(" ") || "Score this ad: https://example.com/ad.mp4",
  tools: { score_ad: scoreAdTool },
  stopWhen: stepCountIs(5),
});
console.log(text);
