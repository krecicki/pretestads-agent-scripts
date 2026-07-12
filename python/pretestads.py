"""Shared PreTestAds x402 client.

Pays $5.00 USDC via the x402 protocol (Solana or Base) to score one ad,
then polls the free status endpoint until the score is ready.

Wallet env vars (set at least one; keys sign locally, never sent anywhere):
    SOLANA_PRIVATE_KEY  base58 secret key (wallet needs USDC + a little SOL)
    EVM_PRIVATE_KEY     0x-hex key       (wallet needs USDC + ETH on Base)

Requires: pip install httpx "x402[evm,svm]"
"""
import asyncio
import os
import time

import httpx

SCORE_URL = os.environ.get("PRETESTADS_SCORE_URL", "https://pretestads.com/api/v1/score")


def _build_x402_client():
    from x402 import x402Client

    client = x402Client()
    registered = []

    if os.environ.get("SOLANA_PRIVATE_KEY"):
        from solders.keypair import Keypair
        from x402.mechanisms.svm.signers import KeypairSigner
        from x402.mechanisms.svm.exact import ExactSvmClientScheme

        signer = KeypairSigner(Keypair.from_base58_string(os.environ["SOLANA_PRIVATE_KEY"]))
        client.register("solana:*", ExactSvmClientScheme(signer))
        registered.append(f"solana ({signer.address})")

    if os.environ.get("EVM_PRIVATE_KEY"):
        from eth_account import Account
        from x402.mechanisms.evm.exact import ExactEvmClientScheme

        account = Account.from_key(os.environ["EVM_PRIVATE_KEY"])
        client.register("eip155:*", ExactEvmClientScheme(account))
        registered.append(f"evm ({account.address})")

    if not registered:
        raise RuntimeError("Set SOLANA_PRIVATE_KEY and/or EVM_PRIVATE_KEY to pay via x402.")
    return client, registered


def _media_kwargs(media: str, window_seconds: int):
    """Local file -> multipart upload; otherwise JSON media_url."""
    if os.path.isfile(media):
        with open(media, "rb") as f:
            return {
                "files": {"file": (os.path.basename(media), f.read(), "application/octet-stream")},
                "data": {"window_seconds": str(window_seconds)},
            }
    return {"json": {"media_url": media, "window_seconds": window_seconds}}


async def submit_ad(media: str, window_seconds: int = 15) -> dict:
    """Pay $5 USDC via x402 and submit an ad (URL or local path) for scoring.

    Returns the 202 body: {"id", "status", "status_url", "payment": {...}}.
    """
    from x402.schemas import PaymentRequired
    from x402.http.utils import encode_payment_signature_header

    client, wallets = _build_x402_client()

    async with httpx.AsyncClient(timeout=180) as http:
        # 1. Unpaid probe -> 402 with payment requirements
        r = await http.post(SCORE_URL, json={})
        if r.status_code != 402:
            raise RuntimeError(f"Expected 402, got {r.status_code}: {r.text[:300]}")
        payment_required = PaymentRequired.model_validate(r.json())

        # 2. Sign a USDC payment for whichever network matches our wallet
        payload = await client.create_payment_payload(payment_required)
        header = encode_payment_signature_header(payload)

        # 3. Paid retry with the actual media
        r = await http.post(
            SCORE_URL,
            headers={"PAYMENT-SIGNATURE": header},
            **_media_kwargs(media, window_seconds),
        )
        if r.status_code != 202:
            raise RuntimeError(f"Submit failed ({r.status_code}): {r.text[:300]}")
        return r.json()


async def wait_for_score(status_url: str, timeout_minutes: int = 15, quiet: bool = False) -> dict:
    """Poll the free status endpoint until complete/failed (~5-8 min typical)."""
    async with httpx.AsyncClient(timeout=60) as http:
        deadline = time.time() + timeout_minutes * 60
        while time.time() < deadline:
            body = (await http.get(status_url)).json()
            status = body.get("status")
            if not quiet:
                print(f"    {time.strftime('%H:%M:%S')}  status={status}", flush=True)
            if status in ("complete", "failed"):
                return body
            await asyncio.sleep(20)
    raise TimeoutError("Timed out waiting for the score.")


async def score_ad_async(media: str, window_seconds: int = 15, quiet: bool = False) -> dict:
    """Pay, submit, and wait. Returns the final result body (score, label, verdict...)."""
    job = await submit_ad(media, window_seconds)
    if not quiet:
        print(f"Paid & queued: id={job['id']} (scoring takes ~5-8 min)", flush=True)
    return await wait_for_score(job["status_url"], quiet=quiet)


def score_ad(media: str, window_seconds: int = 15, quiet: bool = False) -> dict:
    """Synchronous wrapper — safe to call from LLM tool handlers."""
    return asyncio.run(score_ad_async(media, window_seconds, quiet=quiet))
