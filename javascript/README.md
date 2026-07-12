# JavaScript / Node scripts

Node 18+ required (uses built-in `fetch`).

```bash
npm install                 # x402-fetch + viem (payment)
```

Set a Base wallet (USDC + a little ETH on Base):

```bash
export EVM_PRIVATE_KEY=0x...
```

> Paying on Solana from JS depends on your `x402-fetch` version's SVM support. The [Python scripts](../python) support Solana out of the box.

| Script | Run |
|---|---|
| `score-ad.mjs` | `node score-ad.mjs https://example.com/ad.mp4` |
| `openai-agent.mjs` | `npm i openai` → `OPENAI_API_KEY=sk-... node openai-agent.mjs "Score https://example.com/ad.mp4"` |
| `anthropic-agent.mjs` | `npm i @anthropic-ai/sdk` → `ANTHROPIC_API_KEY=... node anthropic-agent.mjs "..."` |
| `gemini-agent.mjs` | `npm i @google/genai` → `GEMINI_API_KEY=... node gemini-agent.mjs "..."` |
| `vercel-ai-tool.mjs` | `npm i ai @ai-sdk/openai zod` → exports `scoreAdTool` + demo |
| `langchainjs-tool.mjs` | `npm i @langchain/core @langchain/openai zod` → exports `scoreAdTool` + demo |
| `download-benchmark-video.mjs` | `node download-benchmark-video.mjs <ad_id>` ($0.50) |

`lib/pretestads.mjs` is the shared client — `scoreAd(media, windowSeconds)` pays, submits, and polls. SDK APIs move fast; if a provider snippet drifts from the current SDK version, the tool definition and the `scoreAd` call are the parts to keep.
