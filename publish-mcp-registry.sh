#!/bin/bash
# Publish PreTestAds to the Official MCP Registry (registry.modelcontextprotocol.io)
# Run from this directory. Requires the browser for GitHub OAuth (login as krecicki —
# the io.github.krecicki namespace is tied to that GitHub account).
set -e
cd "$(dirname "$0")"

# 1. Install the publisher CLI (once)
command -v mcp-publisher >/dev/null || brew install mcp-publisher

# 2. GitHub OAuth login (opens browser; authorize as krecicki)
mcp-publisher login github

# 3. Publish server.json (remote server https://pretestads.com/mcp — no npm package needed)
mcp-publisher publish

# 4. Verify
curl -s https://registry.modelcontextprotocol.io/v0/servers?search=pretestads | head -40
echo ""
echo "Done. PulseMCP ingests daily / processes weekly; Glama and mcp.directory auto-discover from the registry too."
