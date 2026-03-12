// stocknse-india-ultrafast.mjs

import fetch from "node-fetch";

const NSE_URL = "https://artilleryfeed2.onrender.com/";
const NSE_URL2 = "https://scraper-api-eyiz.onrender.com/";
const FYERS_URL = "https://fyersfeed.onrender.com/stream";

const FYERS_SYMBOL = "NSE:NIFTY50-INDEX";

const TIMEOUT = 5000;

/* ---------------------------------------------------------- */
/* GENERIC TIMEOUT FETCH                                      */
/* ---------------------------------------------------------- */

async function fetchJSON(url, controller) {

  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {

    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) throw new Error("HTTP " + res.status);

    return await res.json();

  } finally {

    clearTimeout(timeout);

  }

}

/* ---------------------------------------------------------- */
/* NSE PARSER                                                 */
/* ---------------------------------------------------------- */

function parseNSE(json) {

  const spot =
    json?.marketState?.find(x => x.index === "NIFTY 50")?.last ||
    json?.indicativenifty50?.closingValue;

  if (!spot) return null;

  return Number(spot);

}

/* ---------------------------------------------------------- */
/* FYERS STREAM PARSER                                        */
/* ---------------------------------------------------------- */

async function fetchFyers(token, controller) {

  try {

    const url = `${FYERS_URL}?accessToken=${token}`;

    const res = await fetch(url, { signal: controller.signal });

    if (!res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {

      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");

      buffer = lines.pop();

      for (const line of lines) {

        if (!line.startsWith("data:")) continue;

        try {

          const json = JSON.parse(line.replace("data:", "").trim());

          if (json.symbol === FYERS_SYMBOL && json.ltp) {
            return Number(json.ltp);
          }

        } catch {}

      }

    }

  } catch {

    return null;

  }

}

/* ---------------------------------------------------------- */
/* ULTRA FAST MASTER                                          */
/* ---------------------------------------------------------- */

export async function fetchNiftySpot(token) {

  console.log("🚀 Ultra-fast NIFTY fetch started");

  const controller1 = new AbortController();
  const controller2 = new AbortController();
  const controller3 = new AbortController();

  try {

    const p1 = fetchJSON(NSE_URL, controller1)
      .then(parseNSE)
      .then(v => ({ source: "NSE_URL", value: v }));

    const p2 = fetchJSON(NSE_URL2, controller2)
      .then(parseNSE)
      .then(v => ({ source: "NSE_URL2", value: v }));

    const p3 = fetchFyers(token, controller3)
      .then(v => ({ source: "FYERS", value: v }));

    const result = await Promise.any([p1, p2, p3]);

    if (result.value) {

      console.log(`✅ NIFTY from ${result.source}:`, result.value);

      // abort remaining requests
      controller1.abort();
      controller2.abort();
      controller3.abort();

      return result.value;

    }

  } catch {

    console.log("⚠ All providers failed");

  }

  return 24400;

}