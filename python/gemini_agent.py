#!/usr/bin/env python3
"""Gemini agent (your GEMINI_API_KEY) with a PreTestAds score_ad tool.

Uses the google-genai SDK's automatic function calling: pass the Python
function directly and Gemini calls it when needed. The tool pays $5.00 USDC
via x402 (SOLANA_PRIVATE_KEY or EVM_PRIVATE_KEY) and blocks ~5-8 min.

Usage:
    pip install google-genai
    GEMINI_API_KEY=... SOLANA_PRIVATE_KEY=<b58> \
      python gemini_agent.py "Score this ad and suggest improvements: https://example.com/ad.mp4"
"""
import os
import sys

from google import genai
from google.genai import types

import pretestads

MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-pro")


def score_ad(media_url: str, window_seconds: int = 15) -> dict:
    """Score a video or image ad with PreTestAds' fMRI-trained neural model.

    Costs $5.00 USDC (paid automatically via x402) and takes 5-8 minutes.
    Returns a 0-100 percentile score vs 76 top TikTok ads, a weak/moderate/strong
    label, hook strength, and a per-second engagement timeseries.

    Args:
        media_url: Public https URL of the ad (mp4/mov/avi/jpg/png/webp).
        window_seconds: Scoring window: 3, 5, 15, 30, or 60 (default 15).
    """
    print(f"[tool] score_ad({media_url}) — paying $5 USDC via x402, then waiting for the model...")
    return pretestads.score_ad(media_url, window_seconds)


def main():
    prompt = " ".join(sys.argv[1:]) or "Score this ad: https://example.com/ad.mp4"
    client = genai.Client()  # reads GEMINI_API_KEY
    resp = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="You are an ad-creative analyst. Use the score_ad tool when asked to evaluate an ad, then interpret the results with concrete advice.",
            tools=[score_ad],  # automatic function calling
        ),
    )
    print(resp.text)


if __name__ == "__main__":
    main()
