#!/usr/bin/env node
/**
 * PreTestAds MCP server — exposes ad scoring as MCP tools for Claude Desktop,
 * Claude Code, Cursor, or any MCP client.
 *
 * Tools:
 *   score_ad(media_url, window_seconds)  — pays $5.00 USDC via x402, returns job id immediately
 *   get_score(id)                        — free status/result poll
 *   score_ad_and_wait(media_url, ...)    — pays and blocks until the score is ready (~5-8 min)
 *
 * Run:  EVM_PRIVATE_KEY=0x... node server.mjs   (stdio transport)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { submitAd, waitForScore, scoreAd, SCORE_URL } from "../javascript/lib/pretestads.mjs";

const server = new McpServer({ name: "pretestads", version: "1.0.0" });

const json = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

server.tool(
  "score_ad",
  "Submit a video/image ad to PreTestAds' fMRI-trained neural model. Pays $5.00 USDC automatically " +
    "via x402 from the configured wallet. Returns a job id immediately; scoring takes 5-8 minutes — " +
    "poll with get_score. Score is 0-100 percentile vs 76 top TikTok ads (weak/moderate/strong).",
  {
    media_url: z.string().describe("Public https URL of the ad (mp4/mov/avi/jpg/png/webp)"),
    window_seconds: z.number().optional().describe("Scoring window: 3, 5, 15, 30, or 60 (default 15)"),
  },
  async ({ media_url, window_seconds }) => json(await submitAd(media_url, window_seconds ?? 15))
);

server.tool(
  "get_score",
  "Get the status/result of a PreTestAds scoring job (free, no payment). " +
    "Returns status pending|processing|complete|failed, and when complete: score 0-100, label, " +
    "verdict, and per-second engagement timeseries.",
  { id: z.string().describe("Job id returned by score_ad") },
  async ({ id }) => json(await (await fetch(`${SCORE_URL}/${id}`)).json())
);

server.tool(
  "score_ad_and_wait",
  "Score an ad and wait for the full result (pays $5.00 USDC via x402, blocks ~5-8 minutes). " +
    "Prefer score_ad + get_score if your client times out on long tool calls.",
  {
    media_url: z.string().describe("Public https URL of the ad"),
    window_seconds: z.number().optional().describe("Scoring window: 3, 5, 15, 30, or 60 (default 15)"),
  },
  async ({ media_url, window_seconds }) =>
    json(await scoreAd(media_url, window_seconds ?? 15, { quiet: true }))
);

await server.connect(new StdioServerTransport());
