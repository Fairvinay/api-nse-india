// stocknse-india-new.mjs

import fetch from "node-fetch";

const NSE_URL =  "https://artilleryfeed2.onrender.com/";  //"http://localhost:3065/";
const FYERS_URL = "https://fyersfeed.onrender.com/stream";

const FYERS_SYMBOL = "NSE:NIFTY50-INDEX";

/* ---------------------------------------------------------- */
/* FETCH FROM NSE SERVICE                                     */
/* ---------------------------------------------------------- */

async function fetchFromNSE() {

  try {

    const res = await fetch(NSE_URL, { timeout: 4000 });

    if (!res.ok) throw new Error("NSE service failed");

    const json = await res.json();

    const spot =
      json?.marketState?.find(x => x.index === "NIFTY 50")?.last
      || json?.indicativenifty50?.closingValue;

    if (!spot) throw new Error("NIFTY value missing");

    return Number(spot);

  } catch (err) {

    console.log("❌ NSE fetch failed:", err.message);
    return null;

  }

}

/* ---------------------------------------------------------- */
/* FETCH FROM FYERS SSE STREAM                                */
/* ---------------------------------------------------------- */

async function fetchFromFyers(accessToken) {

  try {

    const url = `${FYERS_URL}?accessToken=${accessToken}`;

    const response = await fetch(url);

    if (!response.body)
      throw new Error("No stream body");

    const reader = response.body.getReader();
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

        const payload = line.replace("data:", "").trim();

        try {

          const json = JSON.parse(payload);

          if (json.symbol === FYERS_SYMBOL && json.ltp) {

            return Number(json.ltp);

          }

        } catch {
          // ignore non JSON messages
        }

      }

    }

  } catch (err) {

    console.log("❌ Fyers fetch failed:", err.message);
    return null;

  }

}

/* ---------------------------------------------------------- */
/* MASTER FETCH FUNCTION                                      */
/* ---------------------------------------------------------- */

export async function fetchNiftySpot(token) {

  console.log("🚀 Fetching NIFTY spot...");

  // Try NSE first
  const nseSpot = await fetchFromNSE();

  if (nseSpot) {

    console.log("✅ NIFTY from NSE:", nseSpot);
    return nseSpot;

  }
  
  console.log("⚠️ NSE unavailable. Trying FYERS...");

  const fyersSpot = await fetchFromFyers(token);

  if (fyersSpot) {

    console.log("✅ NIFTY from FYERS:", fyersSpot);
    return fyersSpot;

  }  
  
  console.log("❌ All sources failed");
  return 24400; 
  //throw new Error("Unable to fetch NIFTY spot");

}