#!/usr/bin/env python3
"""CrewAI tool for PreTestAds ad scoring — give any crew member the ability to
pre-test ad creative on real brain-response predictions.

Usage as a library:
    from crewai_tool import score_ad_tool
    analyst = Agent(role="Ad analyst", ..., tools=[score_ad_tool])

Run the built-in demo (needs OPENAI_API_KEY or other CrewAI-supported LLM key,
plus a wallet key):
    pip install crewai
    OPENAI_API_KEY=sk-... SOLANA_PRIVATE_KEY=<b58> \
      python crewai_tool.py https://example.com/ad.mp4
"""
import json
import sys

from crewai.tools import tool

import pretestads


@tool("score_ad")
def score_ad_tool(media_url: str, window_seconds: int = 15) -> str:
    """Score a video or image ad with PreTestAds' fMRI-trained neural model.
    Costs $5.00 USDC (paid automatically via x402) and takes 5-8 minutes.
    Returns a 0-100 percentile score vs 76 top TikTok ads, weak/moderate/strong
    label, hook strength, and per-second engagement timeseries.
    media_url must be a public https URL; window_seconds is 3/5/15/30/60."""
    print(f"[tool] score_ad({media_url}) — paying $5 USDC via x402, then waiting for the model...")
    return json.dumps(pretestads.score_ad(media_url, window_seconds))


def demo():
    from crewai import Agent, Crew, Task

    media_url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com/ad.mp4"

    analyst = Agent(
        role="Ad creative analyst",
        goal="Pre-test ad creative and deliver actionable feedback",
        backstory="You evaluate ads with neural attention scoring before any money is spent on media.",
        tools=[score_ad_tool],
    )
    task = Task(
        description=f"Score the ad at {media_url} with the score_ad tool, then write a short report: "
                    "the score, what the attention curve says, and 3 concrete improvements.",
        expected_output="A short creative report with the score and 3 improvements.",
        agent=analyst,
    )
    print(Crew(agents=[analyst], tasks=[task]).kickoff())


if __name__ == "__main__":
    demo()
