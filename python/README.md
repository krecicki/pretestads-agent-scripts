# Python scripts

```bash
pip install -r requirements.txt
```

Set a payment wallet (either or both):

```bash
export SOLANA_PRIVATE_KEY=<base58 secret key>   # wallet needs USDC + a little SOL
export EVM_PRIVATE_KEY=0x...                    # wallet needs USDC + a little ETH on Base
```

| Script | Run |
|---|---|
| `score_ad.py` | `python score_ad.py https://example.com/ad.mp4` |
| `openai_agent.py` | `pip install openai` → `OPENAI_API_KEY=sk-... python openai_agent.py "Score https://example.com/ad.mp4"` |
| `anthropic_agent.py` | `pip install anthropic` → `ANTHROPIC_API_KEY=... python anthropic_agent.py "Score https://example.com/ad.mp4"` |
| `gemini_agent.py` | `pip install google-genai` → `GEMINI_API_KEY=... python gemini_agent.py "Score https://example.com/ad.mp4"` |
| `langchain_tool.py` | `pip install langchain langchain-openai` → import `score_ad_tool`, or run the demo |
| `crewai_tool.py` | `pip install crewai` → import `score_ad_tool`, or run the demo |
| `download_benchmark_video.py` | `python download_benchmark_video.py <ad_id>` ($0.50) |

Each scoring run costs $5.00 USDC and takes ~5–8 minutes. `pretestads.py` is the shared client — `score_ad(media, window_seconds)` is the one function every integration wraps.
