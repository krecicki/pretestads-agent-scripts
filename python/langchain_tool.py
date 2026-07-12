#!/usr/bin/env python3
"""LangChain tool for PreTestAds ad scoring — drop into any LangChain/LangGraph agent.

Usage as a library:
    from langchain_tool import score_ad_tool
    agent = create_react_agent(model, tools=[score_ad_tool])   # langgraph
    # or: model.bind_tools([score_ad_tool])

Run the built-in demo (needs OPENAI_API_KEY + a wallet key):
    pip install langchain langchain-openai
    OPENAI_API_KEY=sk-... EVM_PRIVATE_KEY=0x... \
      python langchain_tool.py "Score this ad: https://example.com/ad.mp4"
"""
import json
import sys

from langchain_core.tools import tool

import pretestads


@tool
def score_ad_tool(media_url: str, window_seconds: int = 15) -> str:
    """Score a video or image ad with PreTestAds' fMRI-trained neural model.
    Costs $5.00 USDC (paid automatically via x402) and takes 5-8 minutes.
    Returns a 0-100 percentile score vs 76 top TikTok ads, weak/moderate/strong
    label, hook strength, and per-second engagement timeseries.
    media_url must be a public https URL (mp4/mov/avi/jpg/png/webp);
    window_seconds is 3, 5, 15, 30, or 60."""
    print(f"[tool] score_ad({media_url}) — paying $5 USDC via x402, then waiting for the model...")
    return json.dumps(pretestads.score_ad(media_url, window_seconds))


def demo():
    from langchain_openai import ChatOpenAI

    prompt = " ".join(sys.argv[1:]) or "Score this ad: https://example.com/ad.mp4"
    model = ChatOpenAI(model="gpt-4o").bind_tools([score_ad_tool])

    messages = [("system", "You are an ad-creative analyst. Use score_ad_tool to evaluate ads, then give concrete advice."),
                ("human", prompt)]
    ai = model.invoke(messages)
    while ai.tool_calls:
        messages.append(ai)
        for call in ai.tool_calls:
            out = score_ad_tool.invoke(call["args"])
            messages.append({"role": "tool", "tool_call_id": call["id"], "content": out})
        ai = model.invoke(messages)
    print(ai.content)


if __name__ == "__main__":
    demo()
