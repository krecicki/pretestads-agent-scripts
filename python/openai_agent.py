#!/usr/bin/env python3
"""OpenAI agent (your OPENAI_API_KEY) with a PreTestAds score_ad tool.

The model decides when to score; the tool pays $5.00 USDC via x402
(SOLANA_PRIVATE_KEY or EVM_PRIVATE_KEY) and blocks ~5-8 min for the result.

Usage:
    pip install openai
    OPENAI_API_KEY=sk-... SOLANA_PRIVATE_KEY=<b58> \
      python openai_agent.py "Score this ad and suggest improvements: https://example.com/ad.mp4"
"""
import json
import os
import sys

from openai import OpenAI

from pretestads import score_ad

MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

TOOLS = [{
    "type": "function",
    "function": {
        "name": "score_ad",
        "description": (
            "Score a video or image ad with PreTestAds' fMRI-trained neural model. "
            "Costs $5.00 USDC (paid automatically via x402) and takes 5-8 minutes. "
            "Returns a 0-100 percentile score vs 76 top TikTok ads, a weak/moderate/strong "
            "label, hook strength, attention-drop second, and a per-second engagement timeseries."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "media_url": {"type": "string", "description": "Public https URL of the ad (mp4/mov/avi/jpg/png/webp)"},
                "window_seconds": {"type": "integer", "enum": [3, 5, 15, 30, 60], "description": "Scoring window (default 15)"},
            },
            "required": ["media_url"],
        },
    },
}]


def main():
    prompt = " ".join(sys.argv[1:]) or "Score this ad: https://example.com/ad.mp4"
    client = OpenAI()
    messages = [
        {"role": "system", "content": "You are an ad-creative analyst. Use the score_ad tool when asked to evaluate an ad, then interpret the results with concrete advice."},
        {"role": "user", "content": prompt},
    ]

    while True:
        resp = client.chat.completions.create(model=MODEL, messages=messages, tools=TOOLS)
        msg = resp.choices[0].message
        messages.append(msg)

        if not msg.tool_calls:
            print(msg.content)
            return

        for call in msg.tool_calls:
            args = json.loads(call.function.arguments)
            print(f"[tool] score_ad({args}) — paying $5 USDC via x402, then waiting for the model...")
            try:
                result = score_ad(args["media_url"], args.get("window_seconds", 15))
            except Exception as e:  # surface failures to the model
                result = {"error": str(e)}
            messages.append({"role": "tool", "tool_call_id": call.id, "content": json.dumps(result)})


if __name__ == "__main__":
    main()
