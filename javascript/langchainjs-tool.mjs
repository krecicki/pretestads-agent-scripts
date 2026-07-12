#!/usr/bin/env node
/**
 * LangChain.js tool for PreTestAds ad scoring — drop into any LangChain/LangGraph.js agent.
 *
 * Usage:
 *   npm install @langchain/core @langchain/openai zod
 *   OPENAI_API_KEY=sk-... EVM_PRIVATE_KEY=0x... \
 *     node langchainjs-tool.mjs "Score this ad: https://example.com/ad.mp4"
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { scoreAd } from "./lib/pretestads.mjs";

export const scoreAdTool = tool(
  async ({ media_url, window_seconds }) => {
    console.log(`[tool] score_ad(${media_url}) — paying $5 USDC via x402, then waiting...`);
    return JSON.stringify(await scoreAd(media_url, window_seconds ?? 15));
  },
  {
    name: "score_ad",
    description:
      "Score a video or image ad with PreTestAds' fMRI-trained neural model. " +
      "Costs $5.00 USDC (paid automatically via x402) and takes 5-8 minutes. " +
      "Returns a 0-100 percentile score vs 76 top TikTok ads, a weak/moderate/strong label, " +
      "hook strength, and a per-second engagement timeseries.",
    schema: z.object({
      media_url: z.string().describe("Public https URL of the ad (mp4/mov/avi/jpg/png/webp)"),
      window_seconds: z.number().optional().describe("Scoring window: 3, 5, 15, 30, or 60 (default 15)"),
    }),
  }
);

// --- demo agent loop ---
const { ChatOpenAI } = await import("@langchain/openai");
const model = new ChatOpenAI({ model: "gpt-4o" }).bindTools([scoreAdTool]);

const messages = [
  ["system", "You are an ad-creative analyst. Use score_ad to evaluate ads, then give concrete advice."],
  ["human", process.argv.slice(2).join(" ") || "Score this ad: https://example.com/ad.mp4"],
];
let ai = await model.invoke(messages);
while (ai.tool_calls?.length) {
  messages.push(ai);
  for (const call of ai.tool_calls) {
    const out = await scoreAdTool.invoke(call.args);
    messages.push({ role: "tool", tool_call_id: call.id, content: out });
  }
  ai = await model.invoke(messages);
}
console.log(ai.content);
