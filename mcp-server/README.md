# PreTestAds MCP server

Score ads from Claude Desktop, Claude Code, Cursor, or any MCP client. Payment ($5.00 USDC per run) happens automatically via x402 from your wallet.

```bash
cd mcp-server && npm install
```

Claude Desktop / Cursor config (`claude_desktop_config.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "pretestads": {
      "command": "node",
      "args": ["/path/to/pretestads-agent-scripts/mcp-server/server.mjs"],
      "env": { "EVM_PRIVATE_KEY": "0x..." }
    }
  }
}
```

Claude Code:

```bash
claude mcp add pretestads -e EVM_PRIVATE_KEY=0x... -- node /path/to/mcp-server/server.mjs
```

Tools: `score_ad` (pay + queue, returns job id), `get_score` (free poll), `score_ad_and_wait` (pay + block ~5-8 min).

⚠️ Use a dedicated hot wallet holding only what you intend to spend — every `score_ad` call spends $5 USDC on Base.
