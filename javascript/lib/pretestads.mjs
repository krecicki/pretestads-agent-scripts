/**
 * Shared PreTestAds x402 client (Node 18+).
 *
 * Pays $5.00 USDC via x402 on Base to score one ad, then polls the free
 * status endpoint. Set EVM_PRIVATE_KEY (0x-hex; wallet needs USDC + a
 * little ETH on Base). The key signs locally and is never sent anywhere.
 *
 * (Paying on Solana from JS depends on your x402-fetch version's SVM
 * support — the Python scripts in ../python support Solana out of the box.)
 *
 * Requires: npm install x402-fetch viem
 */
import { readFileSync, existsSync } from "node:fs";
import { basename } from "node:path";
import { privateKeyToAccount } from "viem/accounts";
import { wrapFetchWithPayment } from "x402-fetch";

export const SCORE_URL =
  process.env.PRETESTADS_SCORE_URL ?? "https://pretestads.com/api/v1/score";

export function payingFetch() {
  const key = process.env.EVM_PRIVATE_KEY;
  if (!key) throw new Error("Set EVM_PRIVATE_KEY (Base wallet holding USDC).");
  const account = privateKeyToAccount(key);
  // Handles the 402 -> sign -> retry dance automatically.
  return wrapFetchWithPayment(fetch, account);
}

/** Pay $5 USDC and submit an ad (https URL or local file path). Returns the 202 body. */
export async function submitAd(media, windowSeconds = 15) {
  const fetchWithPay = payingFetch();

  let init;
  if (existsSync(media)) {
    const form = new FormData();
    form.append("file", new Blob([readFileSync(media)]), basename(media));
    form.append("window_seconds", String(windowSeconds));
    init = { method: "POST", body: form };
  } else {
    init = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_url: media, window_seconds: windowSeconds }),
    };
  }

  const r = await fetchWithPay(SCORE_URL, init);
  if (r.status !== 202) {
    throw new Error(`Submit failed (${r.status}): ${(await r.text()).slice(0, 300)}`);
  }
  return r.json();
}

/** Poll the free status endpoint until complete/failed (~5-8 min typical). */
export async function waitForScore(statusUrl, { timeoutMinutes = 15, quiet = false } = {}) {
  const deadline = Date.now() + timeoutMinutes * 60_000;
  while (Date.now() < deadline) {
    const body = await (await fetch(statusUrl)).json();
    if (!quiet) console.log(`    ${new Date().toLocaleTimeString()}  status=${body.status}`);
    if (body.status === "complete" || body.status === "failed") return body;
    await new Promise((res) => setTimeout(res, 20_000));
  }
  throw new Error("Timed out waiting for the score.");
}

/** Pay, submit, wait. Returns the final result (score, label, verdict, timeseries). */
export async function scoreAd(media, windowSeconds = 15, opts = {}) {
  const job = await submitAd(media, windowSeconds);
  if (!opts.quiet) console.log(`Paid & queued: id=${job.id} (scoring takes ~5-8 min)`);
  return waitForScore(job.status_url, opts);
}
