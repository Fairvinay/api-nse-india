// stocknse-india-ultrafast.mjs

import fetch from "node-fetch";

const NSE_URL = "https://artilleryfeed2.onrender.com/";
const NSE_URL2 = "https://scraper-api-eyiz.onrender.com/";
const FYERS_URL = "https://fyersfeed.onrender.com/stream";

const FYERS_SYMBOL = "NSE:NIFTY50-INDEX";

const TIMEOUT = 45000;
const TIMEOUTFYERS = 100000;

/* ---------------------------------------------------------- */
/* GENERIC TIMEOUT FETCH                                      */
/* ---------------------------------------------------------- */

async function fetchJSON(url, controller) {

  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {

    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) throw new Error("HTTP " + res.status);
    let kt = await res.json();
    console.log("fetchJSON success "+ JSON.stringify(kt));


    return kt;

  } finally {
    console.log("fetchJSON finally timed out for " + url + " "+Date.now());
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
	const start = Date.now();


    while (true) {
       if (Date.now() - start > TIMEOUTFYERS) {
  	   throw new Error("Fyers timeout");
  	}
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
  .then(v => {
    if (!v) {  console.log(`could not load from  ${NSE_URL} data`);  } 
    return { source: "NSE_URL", value: v };
  }) .catch(err => {
    console.log(` NSE_URL ${NSE_URL}  failed:  ${err.message} `  );
    throw err; // 🔥 IMPORTANT → rethrow for Promise.any
  });

    const p2 = fetchJSON(NSE_URL2, controller2)
  .then(parseNSE)
  .then(v => {
    if (!v) { console.log(`could not load from  ${NSE_URL2} data`);  } 
    return { source: "NSE_URL2", value: v };
  }).catch(err => {
    console.log(` NSE_URL2 ${NSE_URL2}  failed:  ${err.message} `  );
    throw err; // 🔥 IMPORTANT → rethrow for Promise.any
  });


   const p3 = fetchFyers(token, controller3)
  .then(v => {
    if (!v) {  console.log(`could not load from FYERS  ${FYERS_URL} data`);  } 
    return { source: "FYERS", value: v };
  }) .catch(err => {
    console.log(`  FYERS ${FYERS_URL}  failed: ${err.message} `);
    throw err;
  });

    const result = await Promise.any([p1, p2, p3]);

    if (result.value  !== null &&  result.value  !== undefined ) {

      console.log(`✅ NIFTY from ${result.source}:`, result.value);

      // abort remaining requests
      controller1.abort();
      controller2.abort();
      controller3.abort();

      return result.value;

    }

  } catch (err) {
    console.log("⚠ All providers failed");

   if (err instanceof AggregateError) {
        err.errors.forEach((e, i) => {
         console.log(`❌ Error ${i + 1}:`, e.message);
       });
   } else {
      console.log("Unexpected error:", err);
   }
}

  return 24400;

}