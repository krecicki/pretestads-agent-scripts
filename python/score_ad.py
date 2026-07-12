#!/usr/bin/env python3
"""Score an ad with PreTestAds — plain x402 agent, no LLM, no account.

Usage:
    SOLANA_PRIVATE_KEY=<base58> python score_ad.py https://example.com/ad.mp4
    EVM_PRIVATE_KEY=0x...       python score_ad.py ~/Desktop/ad.mp4 --window 30

Costs $5.00 USDC per run (Solana or Base). Result in ~5-8 minutes.
"""
import argparse
import json

from pretestads import score_ad


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("media", help="Public https:// URL or local file path (mp4/mov/avi/jpg/png/webp)")
    p.add_argument("--window", type=int, default=15, choices=[3, 5, 15, 30, 60],
                   help="Scoring window in seconds (default 15)")
    args = p.parse_args()

    result = score_ad(args.media, window_seconds=args.window)
    print(json.dumps(result, indent=2))
    if result.get("status") == "complete":
        print(f"\nScore: {result.get('score')}/100 — {result.get('label')}")


if __name__ == "__main__":
    main()
