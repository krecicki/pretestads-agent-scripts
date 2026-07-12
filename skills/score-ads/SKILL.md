---
name: score-ads
description: Pre-test a video or image ad by scoring it with PreTestAds' fMRI-trained neural model via the x402 pay-per-request API ($5 USDC, no account). Use when the user asks to score an ad, pre-test creative, check hook strength, or predict ad attention/performance before spending on media.
---

# Score ads with PreTestAds

Score any video (MP4/MOV/AVI) or image (JPG/PNG/WebP) ad against 76 top-performing TikTok ads. Output: 0–100 percentile score, weak/moderate/strong label, hook strength, attention-drop second, per-second engagement curve.

## Prerequisites

- `pip install httpx "x402[evm,svm]"`
- A wallet env var: `SOLANA_PRIVATE_KEY` (base58, USDC + a little SOL) or `EVM_PRIVATE_KEY` (0x-hex, USDC + a little ETH on Base).
- Each run costs **$5.00 USDC** — confirm with the user before paying.

## Steps

1. Confirm the media (public https URL or local file path) and that the user approves the $5 charge.
2. Run the scorer from this repo:
   ```bash
   python python/score_ad.py <media_url_or_path> [--window 3|5|15|30|60]
   ```
   It pays via x402, submits, and polls until done (~5–8 minutes). Do not re-run on timeout without checking the status URL first — the payment already went through.
3. If it printed a job id but timed out, poll the free status endpoint:
   ```bash
   curl https://pretestads.com/api/v1/score/<id>
   ```
4. Interpret for the user: score + label, hook strength (first 3s is decisive on feed platforms), where attention drops, and what the engagement curve suggests changing. Strong = 70+, moderate = 40–69, weak = <40.

## Notes

- Invalid media returns 422 and is never charged.
- One payment = one run; replayed payment proofs are rejected.
- Benchmark context (free to read): https://pretestads.com/tiktok-ad-benchmark-library
