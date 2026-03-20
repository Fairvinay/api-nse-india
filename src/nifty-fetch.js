// nifty-fetch-fixed.js

const YAHOO_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1m&range=1d";

const TIMEOUT = 5000;
let globalPrice = 23023;
async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

function parseYahoo(json) {
  const result = json?.chart?.result?.[0];

  const price =
    result?.meta?.regularMarketPrice ||
    result?.indicators?.quote?.[0]?.close?.slice(-1)[0];

  if (price == null) throw new Error("Invalid price");

  return Number(price);
}

export async function fetchNiftySpotExt(retries = 3) {
  for (let i = 1; i <= retries; i++) {
    try {
      const json = await fetchWithTimeout(YAHOO_URL, TIMEOUT);

      const price = parseYahoo(json);

      console.log(`✅ NIFTY 50 (Attempt ${i}):`, price);

      return price;
    } catch (err) {
      console.log(`❌ Attempt ${i} failed:`, err.message);

      // 🔥 if aborted → retry with longer timeout
      if (err.name === "AbortError") {
        console.log("⏳ Retrying with higher timeout...");
      }

      if (i === retries) {
        console.log("⚠ All retries failed");
      }
    }
  }

  return null;
}

// Run
(async () => {
  const price = await fetchNiftySpotExt();
   globalPrice = price;
  console.log("Final:", price);
})();