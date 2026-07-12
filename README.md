# PreTestAds Agent Scripts

Open-source scripts for scoring video/image ads with the [PreTestAds](https://pretestads.com) neural model (AdCortex™, trained on fMRI brain-response data) — from **any popular LLM platform using your own API key**, or from **any x402-capable agent with a crypto wallet**.

No PreTestAds account. No PreTestAds API key. Each scoring run costs **$5.00 USDC**, paid per-request over the [x402 protocol](https://x402.org) (HTTP 402) on **Solana** or **Base**.

## What the API does

`POST https://pretestads.com/api/v1/score` — submit a video (MP4/MOV/AVI) or image (JPG/PNG/WebP) ad by URL or file upload. You get back a job id; 5–8 minutes later, `GET https://pretestads.com/api/v1/score/{id}` (free) returns:

- **Score 0–100** (percentile vs. 76 top-performing TikTok ads) with a label: weak (<40) / moderate (40–69) / strong (70+)
- Hook Strength (first 3s), Attention Drop second, Peak Moment, Purchase Signal
- Per-second engagement timeseries

There is also a $0.50 endpoint to download any of the 76 benchmark videos: `GET https://pretestads.com/api/benchmarks/{ad_id}/video`.

Full agent docs: [pretestads.com/api-for-ai-agents](https://pretestads.com/api-for-ai-agents) · [llms.txt](https://pretestads.com/llms.txt)

## What's in this repo

| Directory | What | Your API key needed |
|---|---|---|
| [`python/score_ad.py`](python/score_ad.py) | Plain x402 agent CLI — pay, submit, poll | none (just a wallet) |
| [`python/openai_agent.py`](python/openai_agent.py) | OpenAI function-calling agent | `OPENAI_API_KEY` |
| [`python/anthropic_agent.py`](python/anthropic_agent.py) | Claude tool-use agent | `ANTHROPIC_API_KEY` |
| [`python/gemini_agent.py`](python/gemini_agent.py) | Gemini function-calling agent | `GEMINI_API_KEY` |
| [`python/langchain_tool.py`](python/langchain_tool.py) | LangChain tool + agent loop | provider key |
| [`python/crewai_tool.py`](python/crewai_tool.py) | CrewAI tool + crew example | provider key |
| [`python/download_benchmark_video.py`](python/download_benchmark_video.py) | Buy a benchmark video ($0.50) | none |
| [`javascript/score-ad.mjs`](javascript/score-ad.mjs) | Plain x402 agent CLI (Node) | none |
| [`javascript/openai-agent.mjs`](javascript/openai-agent.mjs) | OpenAI function-calling agent | `OPENAI_API_KEY` |
| [`javascript/anthropic-agent.mjs`](javascript/anthropic-agent.mjs) | Claude tool-use agent | `ANTHROPIC_API_KEY` |
| [`javascript/gemini-agent.mjs`](javascript/gemini-agent.mjs) | Gemini function-calling agent | `GEMINI_API_KEY` |
| [`javascript/vercel-ai-tool.mjs`](javascript/vercel-ai-tool.mjs) | Vercel AI SDK tool | provider key |
| [`javascript/langchainjs-tool.mjs`](javascript/langchainjs-tool.mjs) | LangChain.js tool | provider key |
| [`javascript/download-benchmark-video.mjs`](javascript/download-benchmark-video.mjs) | Buy a benchmark video ($0.50) | none |
| [`mcp-server/`](mcp-server/) | MCP server — use from Claude Desktop, Claude Code, Cursor, etc. | none |
| [`skills/score-ads/`](skills/score-ads/) | Claude Code / Cowork skill | none |

Every script pays with **your wallet**, signed locally: set `SOLANA_PRIVATE_KEY` (base58) and/or `EVM_PRIVATE_KEY` (0x-hex, Base). Private keys never leave your machine — they only sign the payment payload.

## Quickstart (no LLM, just score an ad)

Python:

```bash
cd python && pip install -r requirements.txt
SOLANA_PRIVATE_KEY=<base58> python score_ad.py https://example.com/ad.mp4
# or a local file:
EVM_PRIVATE_KEY=0x... python score_ad.py ~/Desktop/ad.mp4
```

Node:

```bash
cd javascript && npm install
EVM_PRIVATE_KEY=0x... node score-ad.mjs https://example.com/ad.mp4
```

## Quickstart (LLM agent with your API key)

```bash
cd python && pip install -r requirements.txt openai
OPENAI_API_KEY=sk-... SOLANA_PRIVATE_KEY=<base58> \
  python openai_agent.py "Score this ad and tell me how to improve it: https://example.com/ad.mp4"
```

The LLM decides when to call the `score_ad` tool; the tool pays $5 USDC via x402, waits for the result, and hands the score back to the model to interpret.

## How the x402 flow works

1. `POST /api/v1/score` with no payment → **HTTP 402** with an `accepts` array (price, USDC asset, network, payTo for Solana and Base).
2. Your x402 client SDK signs a USDC payment authorization with your local key.
3. Retry the POST with the payment header → server verifies + settles via the facilitator → **HTTP 202** with `{id, status_url, payment}`.
4. Poll `GET /api/v1/score/{id}` (free) until `status` is `complete` (~5–8 min).

One payment = one run. Replayed payment proofs are rejected. Invalid media (422) is never charged.

## Wallet setup

- **Solana**: a wallet holding USDC and a little SOL. Export the base58 secret key.
- **Base**: a wallet holding USDC and a little ETH on Base. Export the 0x private key.
- Use a dedicated hot wallet with only what you intend to spend — these scripts read the key from an environment variable.

## Environment variables

See [`.env.example`](.env.example). Never commit a real `.env`.

## License

MIT — see [LICENSE](LICENSE).
