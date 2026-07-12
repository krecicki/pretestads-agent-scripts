#!/usr/bin/env python3
"""Claude agent (your ANTHROPIC_API_KEY) with a PreTestAds score_ad tool.

The model decides when to score; the tool pays $5.00 USDC via x402
(SOLANA_PRIVATE_KEY or EVM_PRIVATE_KEY) and blocks ~5-8 min for the result.

Usage:
    pip install anthropic
    ANTHROPIC_API_KEY=... EVM_PRIVATE_KEY=0x... \
      python anthropic_agent.py "Score this ad and suggest improvements: https://example.com/ad.mp4"
"""
import json
import os
import sys

import anthropic

from pretestads import score_ad

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5")

TOOLS = [{
    "name": "score_ad",
    "description": (
        "Score a video or image ad with PreTestAds' fMRI-trained neural model. "
        "Costs $5.00 USDC (paid automatically via x402) and takes 5-8 minutes. "
        "Returns a 0-100 percentile score vs 76 top TikTok ads, a weak/moderate/strong "
        "label, hook strength, attention-drop second, and a per-second engagement timeseries."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "media_url": {"type": "string", "description": "Public https URL of the ad (mp4/mov/avi/jpg/png/webp)"},
            "window_seconds": {"type": "integer", "enum": [3, 5, 15, 30, 60], "description": "Scoring window (default 15)"},
        },
        "required": ["media_url"],
    },
}]


def main():
    prompt = " ".join(sys.argv[1:]) or "Score this ad: https://example.com/ad.mp4"
    client = anthropic.Anthropic()
    messages = [{"role": "user", "content": prompt}]

    while True:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system="You are an ad-creative analyst. Use the score_ad tool when asked to evaluate an ad, then interpret the results with concrete advice.",
            tools=TOOLS,
            messages=messages,
        )
        messages.append({"role": "assistant", "content": resp.content})

        if resp.stop_reason != "tool_use":
            print("".join(b.text for b in resp.content if b.type == "text"))
            return

        results = []
        for block in resp.content:
            if block.type != "tool_use":
                continue
            print(f"[tool] score_ad({block.input}) — paying $5 USDC via x402, then waiting for the model...")
            try:
                result = score_ad(block.input["media_url"], block.input.get("window_seconds", 15))
            except Exception as e:
                result = {"error": str(e)}
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(result)})
        messages.append({"role": "user", "content": results})


if __name__ == "__main__":
    main()
