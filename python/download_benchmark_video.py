#!/usr/bin/env python3
"""Buy one TikTok benchmark video from PreTestAds for $0.50 USDC via x402.

Browse the 76-ad library (curves, transcripts, scores are free to read):
    https://pretestads.com/tiktok-ad-benchmark-library

Usage:
    SOLANA_PRIVATE_KEY=<base58> python download_benchmark_video.py <ad_id> [out.mp4]
"""
import asyncio
import os
import sys

import httpx

from pretestads import _build_x402_client

BASE = os.environ.get("PRETESTADS_BASE_URL", "https://pretestads.com")


async def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    ad_id = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else f"{ad_id}.mp4"
    url = f"{BASE}/api/benchmarks/{ad_id}/video"

    from x402.schemas import PaymentRequired
    from x402.http.utils import encode_payment_signature_header

    client, _ = _build_x402_client()

    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as http:
        r = await http.get(url)
        if r.status_code != 402:
            print(f"Expected 402, got {r.status_code}: {r.text[:300]}")
            sys.exit(1)
        payload = await client.create_payment_payload(PaymentRequired.model_validate(r.json()))
        header = encode_payment_signature_header(payload)

        r = await http.get(url, headers={"PAYMENT-SIGNATURE": header})
        if r.status_code != 200:
            print(f"Payment failed ({r.status_code}): {r.text[:300]}")
            sys.exit(1)
        video_url = r.json()["video_url"]

        async with http.stream("GET", video_url) as v:
            v.raise_for_status()
            with open(out, "wb") as f:
                async for chunk in v.aiter_bytes():
                    f.write(chunk)
    print(f"Saved {out}")


if __name__ == "__main__":
    asyncio.run(main())
