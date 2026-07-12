#!/usr/bin/env bash
# One-time: create github.com/krecicki/pretestads-agent-scripts and push this folder.
# Run from inside this folder:  GITHUB_TOKEN=ghp_... bash push_to_github.sh
set -euo pipefail

: "${GITHUB_TOKEN:?Set GITHUB_TOKEN=ghp_... (a PAT with repo scope)}"
REPO_NAME="pretestads-agent-scripts"
OWNER="krecicki"

cd "$(dirname "$0")"
# Safety: never run from the wrong tree
[ -f README.md ] && grep -q "PreTestAds Agent Scripts" README.md || { echo "Run from the pretestads-agent-scripts folder"; exit 1; }

# 1. Create the public repo (idempotent — 422 if it already exists is fine)
curl -s -X POST https://api.github.com/user/repos \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"Score video/image ads with the PreTestAds neural model from OpenAI, Claude, Gemini, LangChain, CrewAI, Vercel AI SDK, or any x402-capable agent — pay-per-request in USDC, no API key needed.\",\"homepage\":\"https://pretestads.com/api-for-ai-agents\"}" \
  | grep -o '"full_name": *"[^"]*"' || true

# 2. Init and push (this folder only — never the parent project)
if [ ! -d .git ]; then
  git init -b main
fi
[ "$(git rev-parse --show-toplevel)" = "$(pwd)" ] || { echo "git root mismatch — aborting"; exit 1; }
git add .
git -c user.name="Cody Krecicki" -c user.email="cody@krecicki.com" commit -m "PreTestAds agent scripts: x402 ad scoring from OpenAI, Claude, Gemini, LangChain, CrewAI, Vercel AI, MCP" || true
git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO_NAME}.git"
git push -u origin main
# Scrub the token from the stored remote URL
git remote set-url origin "https://github.com/${OWNER}/${REPO_NAME}.git"
echo "Done: https://github.com/${OWNER}/${REPO_NAME}"
