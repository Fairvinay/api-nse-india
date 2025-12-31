/*const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");
 const express = require('express'); 
    const path = require('path'); // Node.js built-in path module

const app = express();
*/
import fs from "fs";
import https from "https";
import { WebSocket } from "ws";
import http from "http";
import { WebSocketServer } from "ws";
import express from "express";
import  path from 'path' ;
  import { fileURLToPath } from 'url';

        // Get the current directory using ES module syntax
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

 // Define paths to your certificate files
    const privateKeyPath = path.join(__dirname, '../ssl-key', 'server.key');
    const certificatePath = path.join(__dirname, '../ssl-crt', 'server.crt');

    // Read the certificate and private key files
    const options = {
        key: fs.readFileSync(privateKeyPath),
        cert: fs.readFileSync(certificatePath)
        // ca: fs.readFileSync(path.join(__dirname, 'cert', 'ca_bundle.crt')) // Optional: if you have a CA bundle
    };

    const app = express();
// normal REST route (Render needs this for health check)
app.get("/", (req, res) => {
  res.send("WebSocket server is up ✅");
});

const startOfMonth = new Date();
// Create HTTP server
const server = http.createServer(app);
// Load self-signed certificate
/*const server = https.createServer({
  cert: fs.readFileSync("./ssl.crt/server.crt"),
  key: fs.readFileSync("./ssl.key/server.key")
});*/

function getTuesdaysOfMonth(year, monthIndex , day) {
  // monthIndex: 0 = January, 9 = October
  const tuesdays = [];

  // Start from the 1st of the month
  let date = new Date(year, monthIndex, 1);

  // Find the first Tuesday
  while (date.getDay() !== 2) {
    date.setDate(date.getDate() + 1);
  }

  // Collect all Tuesdays in that month
  while (date.getMonth() === monthIndex) {
    //skip expired tuesday from current date 
    let isFUTURE =  isAfterToday(date)
    if(isFUTURE){
        if (date.getDay() >= day || date.getDate() >= 30 ){
           console.log("Adding tuesday "+ day+ " being aded "+date.toString());
    tuesdays.push(new Date(date)); } }
    date.setDate(date.getDate() + 7);
  }

  return tuesdays;
}
function normalizeDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error("Invalid Date object");
  }
  const d = new Date(date);
  
  d.setHours(0, 0, 0, 0);
  return d;
}

function isAfterToday(dateObj) {
        let righNow =startOfMonth;
        if(dateObj.getDate() >= righNow.getDate() && dateObj.getMonth() === righNow.getMonth() && dateObj.getFullYear() === righNow.getFullYear() ) {
          console.log( `current date  ${righNow.getDate()} ${righNow.getMonth()} ${righNow.getFullYear()}`)
          console.log( `compared  date ${dateObj.getDate()} ${dateObj.getMonth() } ${dateObj.getFullYear()}`)
           return true;
        }
        else{ 


        }
  return normalizeDate(dateObj) > normalizeDate(new Date());
}
function compareWithToday(dateStr) {
  if (!dateStr) throw new Error("Date string is required");

  const inputDate = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate < today) return  false;  //"PAST";
  if (inputDate > today) return  true; //"FUTURE";
  return true;
}

// Map month index → single-letter code
const monthCodes = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
// Proper month codes
const monthProperCodes = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];
 const baseGlobalStrike = 25600;
/**
 * Generate short expiry code from a Date
 * Example: Date(2025-10-07) → "25OCT07"
 */
function getShortYYMMDD(dateInput) {

 const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);

  if (isNaN(date)) {
    throw new Error(`Invalid date: ${dateInput}`);
  }

  const yy = String(date.getFullYear()).slice(-2);   // last 2 digits of year
  const mCode = monthCodes[date.getMonth()];         // 3-letter month
  const dd = String(date.getDate()).padStart(2, "0"); // 2-digit day
  return `${yy}${mCode}${dd}`;
}

/**
 * Generate short expiry code from a Date
 * Example: Date(2025-10-07) → "251007"
 */
function getShortYYMMDDDigits(dateInput) {

 const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);

  if (isNaN(date)) {
    throw new Error(`Invalid date: ${dateInput}`);
  }

  const yy = String(date.getFullYear()).slice(-2);   // last 2 digits of year
  const mCode =  date.getMonth()+1 < 10 ?   `0` + date.getMonth()+1 :  date.getMonth()+1 ;         // 3-letter month
  const dd = String(date.getDate()).padStart(2, "0"); // 2-digit day
  return `${yy}${mCode}${dd}`;
}




function formatTuesday(date) {
  const yy = String(date.getFullYear()).slice(-2);
  const mCode = monthCodes[date.getMonth()];
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}${mCode}${dd}`;
}

// ✅ Get current system year & month whenever script starts
const now = new Date();
const currentYear = now.getFullYear();
const currentMonthIndex = now.getMonth(); // 0 = Jan, 9 = Oct
const currentMonthDay = now.getDate();    // 1–31

console.log(
  `Today is ${currentMonthDay}/${currentMonthIndex + 1}/${currentYear}`
);
console.log(" current month current day "+currentMonthDay+" current month "+currentMonthIndex+" current year  "+currentYear);
console.log(" current month current day "+currentMonthDay+" current month "+currentMonthIndex+" current year  "+currentYear);
console.log(" current month current day "+currentMonthDay+" current month "+currentMonthIndex+" current year  "+currentYear);
console.log(" current month current day "+currentMonthDay+" current month "+currentMonthIndex+" current year  "+currentYear);


const isLastMonthofYear = currentMonthIndex ==11 ?  true : false; 
const caculateTuesdayOfNextMonth = (isLastMonthofYear) => { 
        if(isLastMonthofYear) {

          let tuesdayOfFisrtMonthNextYear=       getTuesdaysOfMonth(currentYear+1, currentMonthIndex -11, 2);
          return tuesdayOfFisrtMonthNextYear; 
        }
}

// Example: First Tuesday of October 2025
let tuesdays = getTuesdaysOfMonth(currentYear, currentMonthIndex, currentMonthDay); // 9 = October
   tuesdays = tuesdays.concat(caculateTuesdayOfNextMonth(isLastMonthofYear));

console.log("All Tuesdays:", tuesdays.map(formatTuesday));
console.log("First Tuesday of October 2025:", formatTuesday(tuesdays[0]));
 // === 4. Trade generator ===
  function generateTrade(id, k_const) {
    return [
      id,
      new Date().toISOString(),
      (k_const + Math.random() * 70).toFixed(2),
      "0","0","0",
      (k_const + Math.random() * 70).toFixed(2),
      (k_const + Math.random() * 70).toFixed(2),
      (k_const + Math.random() * 70).toFixed(2),
      (k_const + Math.random() * 70).toFixed(2),
      Math.floor(1000000 + Math.random() * 9000000) + "",
      Math.floor(1000000 + Math.random() * 9000000) + "",
      "0","0","0","0","0"
    ];
  }
// Build expiry → trades map
let current_month_nifty_expiries = {};
let current_month_nifty_expiries_truedata = {};
let total_array_expiries = [] ;
let total_array_expiries_truedata = [] ;
/**
 * Generate a random 9-digit integer
 */
function random9Digit() {
  return Math.floor(100000000 + Math.random() * 900000000);
}


/**
 * Generate trades for each expiry
 * @param {Array} expiries - array of { date, shortKey }
 * @param {Number} baseStrike - starting strike price
 * @param {Number} steps - how many strikes to generate
 * @param {Number} stepSize - increment per strike
 * @param {Number} weeklyInterestRate - usually 15
 */
function generateTrades(
  expiries,
  baseStrike = 25600, //26100,      // this needs to be categorised as configuration object or setting , others are at line 285 1276 
  steps = 7,   // this is for 7 strike prices lsiting 
  stepSize = 100,
  weeklyInterestRate = 15
) {
  const result = {};

  expiries.forEach(exp => {
    const trades = [];

    for (let i = 0; i < steps; i++) {
      const strike = baseStrike + i * stepSize;

      // CE leg
      trades.push({
        id: String(random9Digit()),
        symbol: `NIFTY${exp.shortKey}${strike}CE`,
        k: Math.floor(Math.random() * weeklyInterestRate) + stepSize,
        expiry: exp.shortKey
      });

      // PE leg
      trades.push({
        id: String(random9Digit()),
        symbol: `NIFTY${exp.shortKey}${strike}PE`,
        k: Math.floor(Math.random() * weeklyInterestRate) + stepSize,
        expiry: exp.shortKey
      });
    }
    // add the NIFTY-50 SPOT TRADE 
     trades.push({
        id: String(random9Digit()),
        symbol: `NIFTY-50`,
        k: baseStrike + Math.floor(Math.random() * (weeklyInterestRate/10)) ,
        expiry:  `NIFTY-50`
      });
    total_array_expiries.push([exp.shortKey ,trades ])
    result[exp.shortKey] = trades;
  });

  return result;
}

/**
 * Generate trades for each expiry
 * @param {Array} expiries - array of { date, shortKey }
 * @param {Number} baseStrike - starting strike price
 * @param {Number} steps - how many strikes to generate
 * @param {Number} stepSize - increment per strike
 * @param {Number} weeklyInterestRate - usually 15
 */
function generateTuesdayTrades(
  tuesdayObjects,
  baseStrike =  25600 , // 26100, // this is with relation to truedata actuall values ...
  steps = 7, // this is for 7 strike prices lsiting 
  stepSize = 100,
  weeklyInterestRate = 15
) {
  const result = {};

  tuesdayObjects.forEach(exp => {
    const trades = [];

    for (let i = 0; i < steps; i++) {
      const strike = baseStrike + i * stepSize;

      // CE leg
      trades.push({
        id: String(random9Digit()),
        symbol: `NIFTY${exp.date}${strike}CE`,
        k: Math.floor(Math.random() * weeklyInterestRate) + stepSize,
        expiry: exp.date
      });

      // PE leg
      trades.push({
        id: String(random9Digit()),
        symbol: `NIFTY${exp.date}${strike}PE`,
        k: Math.floor(Math.random() * weeklyInterestRate) + stepSize,
        expiry: exp.date
      });
    }
      // add the NIFTY-50 SPOT TRADE 
     trades.push({
        id: String(random9Digit()),
        symbol: `NIFTY-50`,
        k: baseStrike+  Math.floor(Math.random() * (weeklyInterestRate/10)) ,
        expiry:  `NIFTY-50`
      });

    total_array_expiries_truedata.push([exp.date ,trades ])
    result[exp.date] = trades;
  });

  return result;
}
 const current_month_expiries = tuesdays;
 // Map raw dates → { date, shortKey }
const expiryObjects = current_month_expiries.map(d => ({
  date: d,
  shortKey: getShortYYMMDD(d)
}));
const tuesdayObjects = current_month_expiries.map((d, indx) => ({
  date: getShortYYMMDDDigits(d),
  shortKey: indx
}));
console.log(` weekly epxiry date codes : ----------`);
expiryObjects.forEach( t => {
  console.log(`: ---------- date: ${t["date"]} shortKey: ${t["shortKey"]} `);
})

console.log(`: ---------- structure : ${JSON.stringify(expiryObjects)}   `);
current_month_nifty_expiries = generateTrades(expiryObjects);
current_month_nifty_expiries_truedata = generateTuesdayTrades(tuesdayObjects);
console.log(`current_month_nifty_expiries: ----------`);
console.log(current_month_nifty_expiries);
console.log(`current_month_nifty_expiries_truedata: ----------`);
console.log(current_month_nifty_expiries_truedata);
console.log(`total_array_expiries: ----------`);
console.log(JSON.stringify(total_array_expiries));
console.log(`total_array_expiries_truedata: ----------`);
console.log(JSON.stringify(total_array_expiries_truedata));
//console.log(`current_month_nifty_expiries: ${Array.isArray(current_month_nifty_expiries)} total: ${current_month_nifty_expiries.length}`);
console.log(`total_array_expiries: ${Array.isArray(total_array_expiries)} total: ${total_array_expiries.length}`);

function extractExpiryStrikeMap(dataEntries, isFyers) {
  const map = {};

  for (const [expiryKey, rows] of dataEntries) {
    const strikes = new Set();

    for (const row of rows) {
      if (!row.symbol.startsWith("NIFTY")) continue;
      if (!row.symbol.includes("CE") && !row.symbol.includes("PE")) continue;
       let kq , kl = "";
      // Extract strike
      const strike = (isFyers ? ( kq = row.symbol.match(/NIFTY\d{2}D\d{2}(\d{5})/) ? row.symbol.match(/NIFTY\d{2}D\d{2}(\d{5})/)[1] : "" ) : 
        ( kl = row.symbol.match(/NIFTY\d{6}(\d{5})/) ? row.symbol.match(/NIFTY\d{6}(\d{5})/)[1] : ""));

      if (strike) strikes.add(strike);
    }

    if (strikes.size) {
      map[expiryKey] = strikes;
    }
  }

  return map;
}
const fyersStrikeMap = extractExpiryStrikeMap(
  total_array_expiries,
  true
);

const truedataStrikeMap = extractExpiryStrikeMap(
  total_array_expiries_truedata,
  false
);




const extractExpiryFromSymbol = (symbol) => {
  // FYERS: NIFTY25D0225600CE → 25D02
  const fyersMatch = symbol.match(/NIFTY(\d{2}D\d{2})/);
  if (fyersMatch) return fyersMatch[1];

  // TrueData: NIFTY25120225600CE → 251202
  const truedataMatch = symbol.match(/NIFTY(\d{6})/);
  if (truedataMatch) return truedataMatch[1];

  return null;
};

let expiryKeyMap = {};

Object.entries(total_array_expiries).forEach(([fyersKey, fyersArr]) => {
  if (!fyersArr?.length) return;

  const fyersSymbol = fyersArr[0].symbol;
  const fyersExpiry = extractExpiryFromSymbol(fyersSymbol ? fyersSymbol : "");

  Object.entries(total_array_expiries_truedata).forEach(
    ([trueKey, trueArr]) => {
      if (!trueArr?.length) return;

      const trueSymbol = trueArr[0].symbol;
      const trueExpiry = extractExpiryFromSymbol(trueSymbol ? trueSymbol : "" );

      if (fyersExpiry && trueExpiry) {
        // Match by calendar logic: YYMMDD vs YYDdd
        // Example: 25D02 ↔ 251202
        if (trueExpiry.startsWith(fyersExpiry.replace("D", ""))) {
          expiryKeyMap[fyersExpiry] = trueExpiry;
        }
      }
    }
  );
});
console.log(" Using Regex fetched the keys from true_array_expiries and true_array_expiries_truedata  : symbol.match(/NIFTY(\d{2}D\d{2})/)  FYERS: NIFTY25D0225600CE → 25D02 and /NIFTY(\d{6})/ TrueData: NIFTY25120225600CE → 251202 ");
let expiryKeyMapRegex = Object.assign( {} , expiryKeyMap) ;
console.log(" calculated expiry "+JSON.stringify(expiryKeyMap))
console.log(" Using just key matching and endwith (fyersExpiry.slice(-2) no regex most safe approach ")

Object.values(total_array_expiries).forEach((fyersArr) => {
  if (!fyersArr?.length) return;

  const fyersExpiry = fyersArr[0].expiry;

  Object.values(total_array_expiries_truedata).forEach((trueArr) => {
    if (!trueArr?.length) return;

    const trueExpiry = trueArr[0].expiry;

    // Match by calendar day (02 → 02, 09 → 09 etc.)
    if (trueExpiry !==undefined && trueExpiry !== null && trueExpiry.endsWith(fyersExpiry.slice(-2))) {
      expiryKeyMap[fyersExpiry] = trueExpiry;
    }
  });
});
console.log(" calculated expiry slice approach "+JSON.stringify(expiryKeyMap))


for (const fyersKey in fyersStrikeMap) {
  for (const trueKey in truedataStrikeMap) {
    const fyersStrikes = fyersStrikeMap[fyersKey];
    const trueStrikes = truedataStrikeMap[trueKey];

    // Check intersection
    const match = [...fyersStrikes].some(s => trueStrikes.has(s));

    if (match) {
      expiryKeyMap[fyersKey] = trueKey;
      break;
    }
  }
}
console.log(" calculated expiry fyersStrikeMap /truedataStrikeMap  approach "+JSON.stringify(expiryKeyMap))



function buildSymbolLookup(total_array_expiries) {
  const map = new Map();

  Object.values(total_array_expiries).forEach(expiryArray => {
    if (!Array.isArray(expiryArray)) return;

    expiryArray.forEach(item => {
      if (item?.symbol) {
        map.set(item.symbol, item);
      }
    });
  });

  return map;
}
function resolveSymbols(symbols, total_array_expiries) {
  const symbolMap = buildSymbolLookup(total_array_expiries);
  const result = [];

  for (const sym of symbols) {
    // Skip index / non-option symbols
    if (!sym || !sym.startsWith("NIFTY")) continue;

    const match = symbolMap.get(sym);
    if (match) {
      result.push(match);
    }
  }

  return result;
}



//let total_expiry_keyCombinator = [ total_array_expiries.]
// Start HTTPS server8443
// 8888 for the fyers.web.in/scalper_terminal 
let port = 8443;

// Create an HTTPS server
/*let server  =    https.createServer(options, app).listen(port, () => {
        console.log(`HTTPS server running on port ${port}`);
        console.log(`✅ Mock WSS server running at wss://localhost:${port}`);
    });
*/

// Create WebSocket server over HTTPS
const wss = new WebSocketServer({ server });// new WebSocket.Server({ server });
 let  matching_contracts = [];
wss.on("connection", (ws) => {
  console.log("[WSS] New client connected.");

  // Each client has its own subscriptions
  ws.subscribedSymbols = new Map();
   // Each client has its own state
  ws.matching_contracts = [];
   ws.aslongSubscribedInterval = null; // to track interval
   let initialtrade =[]; let idSym = []; 
const DELAY_BETWEEN_TRADES_MS = 30; // 30 mili seconds delay between individual ws.send() calls
const CYCLE_INTERVAL_MS = 9000;     // The original 17 seconds cycle

  const symbols_const = [
      /* { symbol: "NIFTY25093025300CE", id: "302418032",  },
    {symbol: "NIFTY25093025100PE",  id: "302418025"  },
    { symbol: "NIFTY25093025100CE",id: "302418024"   },
    { symbol: "NIFTY25093025200PE", id: "302418029"  }*/
     { symbol: "NIFTY25D1626000CE", id: "302418032",  },
    {symbol: "NIFTY25D1626000PE",  id: "302418025"  },
    { symbol: "NIFTY25D1626100CE",id: "302418024"   },
 	{ symbol: "NIFTY25D1626100PE", id: "302418029"  } 
  ];
  // === 1. Send TrueData Real Time Data Service event immediately ===
  const mockEvent0 = {
    success: true,
    message: "TrueData Real Time Data Service",
    segments: ["EQ", "FO", "IND", ""],
    maxsymbols: 50,
    subscription: "tick",
    validity: "2025-10-01T00:00:00"
  };
  ws.send(JSON.stringify(mockEvent0));
  console.log("[WSS] Sent mockEvent0 (TrueData Service)");
  /**
 * Recursively sends trades from the contracts array with a 3-second delay
 * between each individual send operation.
 * * @param {Array<Object>} contracts - The array of option contracts to send trades for.
 * @param {number} index - The current index in the contracts array.
 */
function sendDelayedTrades(contracts, index = 0) {
    // Base Case: Stop recursion when all contracts have been processed
    if (index >= contracts.length) {
        console.log(`[WSS] Finished sending all ${contracts.length} trades for the current cycle.`);
        return;
    }

    const { id, symbol, k } = contracts[index];
    
    // 1. Send the current trade immediately
    const trade = generateTrade(id, k);
    // Ensure you check the readyState here if not checked in the setInterval wrapper
    // if (ws.readyState === WebSocket.OPEN) { 
        ws.send(JSON.stringify({ trade })); 
        console.log(`[WSS] Sent trade for ${symbol} (Index ${index}):`, trade[2]);
    // } else {
    //    console.log(`[WSS] WebSocket not open, failed to send trade for ${symbol}`);
    // }

    
    // 2. Schedule the sending of the next trade after the specified delay
    setTimeout(() => {
        sendDelayedTrades(contracts, index + 1);
    }, DELAY_BETWEEN_TRADES_MS); 
}
  // === 2. Keep sending heartbeat ===
  const heartbeatInterval = setInterval(() => {
    const mockEvent1 = {
      success: true,
      message: "HeartBeat",
      timestamp: new Date().toISOString()
    };
    ws.send(JSON.stringify(mockEvent1));
    console.log("[WSS] Sent HeartBeat");
  }, 15000);
    // Start interval only after subscription
     
    const aslongSubscribedInterval = setInterval(() => {
    // if (ws.readyState !== WebSocket.OPEN) { 
    //     console.log(`[WSS] WEBSOCKET NOT OPEN, skipping cycle.`); 
    //     return; 
    // } 

    if (
        Array.isArray(matching_contracts) &&
        matching_contracts.length > 0
    ) {
        console.log(`\n--- Starting new trade cycle (Total contracts: ${matching_contracts.length}) ---`);
        // Start the recursive, delayed sending process for this 17-second cycle
        sendDelayedTrades(matching_contracts); 
    } else {
        console.log("[WSS] No contracts for client yet to send trades for.");
    } 
}, CYCLE_INTERVAL_MS);




  // === 3. Handle client messages ===
  ws.on("message", (msg) => {
    try {
      const request = JSON.parse(msg);
      console.log("[WSS] Received:", request);
     /* 
     select 
      trades_k_const.forEach(({ id, symbol, k }) => {
      if (ws.subscribedSymbols.has(symbol)) {
        const trade = generateTrade(id, k);
        ws.send(JSON.stringify({ trade }));
        console.log(`[WSS] Sent trade for ${symbol}:`, trade[2]);
      }
    });
     */

      if (request.method === "addsymbol" && Array.isArray(request.symbols)) {


         // Reset interval if already running
       // if (ws.aslongSubscribedInterval) {
        //  clearInterval(ws.aslongSubscribedInterval);
        //}
        // --- FILTERING LOGIC ---

      // 1. Convert the array of required symbols into a Set for fast O(1) lookups.
      const symbolSet = new Set(request.symbols);
      console.log(`Searching for ${symbolSet.size} unique symbols...`);

     // 2. Use flatMap to iterate through the nested structure and create a single flat array.
       matching_contracts =  total_array_expiries.flatMap(expiryGroup => {  // total_array_expiries_truedata.flatMap(expiryGroup => {
          // expiryGroup is in the format: ["expiryDate", [contract_objects...]] // consuming from self not truedata 
          const optionsArray = expiryGroup[1];
          
          // Filter the optionsArray: keep only elements where the symbol is in our Set.
          return optionsArray.filter(option => symbolSet.has(option.symbol));
      });
      
      console.log("\n--- Matching Contracts Found ---");
      console.log(`Total matches: ${matching_contracts.length}`);
      console.log(JSON.stringify(matching_contracts, null, 2));
       console.log("\n--- Matching Contracts Using new sym.startsWith 'NIFTY' in total_array_expiries ---");
      const matchedTrades = resolveSymbols(symbolSet, total_array_expiries);
      let mergeMatchedRecord  = [];
      if(matching_contracts.length < matchedTrades.length){
          mergeMatchedRecord = [...matching_contracts , matchedTrades];

      }
       console.log(`New matching contract after merge :  `);
       
      console.log(`Total matches: ${mergeMatchedRecord.length}`);
      console.log(JSON.stringify(mergeMatchedRecord, null, 2));
      const requestedSymbols = new Set(
               request.symbols.filter(s => s.startsWith("NIFTY") && s.includes("CE") || s.includes("PE"))
            )     ;
      //Build a symbol → record index from total_array_expiries
      const fyersSymbolIndex = {};

      Object.values(total_array_expiries).forEach(expiryArr => {
        expiryArr.forEach(record => {
          fyersSymbolIndex[record.symbol] = record;
        });
      });
      const matchedFyersRecords = [];

        requestedSymbols.forEach(symbol => {
          if (fyersSymbolIndex[symbol]) {
            matchedFyersRecords.push(fyersSymbolIndex[symbol]);
          }
        });
          console.log("\n--- Matching Contracts Using considering request symbol in  'NIFTY25D2325800PE' format : lookup in total_array_expiries ---");
           let mergeMatchedRecordSimple  = [];

            console.log(`Original matching_contracts Total matches: ${matching_contracts.length}`);
         if(matching_contracts.length < matchedFyersRecords.length){
          mergeMatchedRecordSimple = [...matching_contracts , matchedFyersRecords];

         }
           console.log(`New matching contract after merge :  `);
           console.log(`Total matches: ${mergeMatchedRecordSimple.length}`);
           console.log(JSON.stringify(mergeMatchedRecordSimple, null, 2));
      
            if(mergeMatchedRecord.length < mergeMatchedRecordSimple.length){
              if(matching_contracts.length < mergeMatchedRecordSimple.length){ 
                     matching_contracts = mergeMatchedRecordSimple;
              }
              else { 
                   matching_contracts = matching_contracts;
              }

         } else { 
                   if(matching_contracts.length < mergeMatchedRecord.length){ 
                     matching_contracts = mergeMatchedRecord;
              }
              else { 
                   matching_contracts = matching_contracts;
              }
             }

        // searach symbols in the generated total_array_expiries_truedata
       
        matching_contracts.forEach(({ id, symbol, k }) => {
           
            const trade = generateTrade(id, k);
            console.log(`[WSS] Initial trade for ${id}:`, JSON.stringify(trade));
             idSym.push([id , symbol]);
               initialtrade.push([symbol, ...trade]);
           // ws.send(JSON.stringify({ trade }));
           // console.log(`[WSS] Sent trade for ${symbol}:`, trade[2]);
            ws.subscribedSymbols.set(id, symbol);
        });
         ws.matching_contracts = matching_contracts;
         

       // request.symbols.forEach(sym => {
       /*     trades_k_const.forEach(({ id, symbol ,k }) => {

               const trade = generateTrade(id, k);
                 ws.send(JSON.stringify({ trade }));
                 console.log(`[WSS] Initial trade for ${id}:`, JSON.stringify(trade));
                 idSym.push([id , symbol]);

                  //trade.push(symbol);
                  initialtrade.push([symbol, ...trade]);
                 ws.subscribedSymbols.set(id, symbol);
             })
             */
        // } )
        let syml =   Array.from(ws.subscribedSymbols.entries());
         console.log(` Initial trades first array :`, JSON.stringify(initialtrade));
        // Deduplicate using Set
        // add the NIFTY-50 SPOT TRADE ---- 
        let currentSpot =  baseGlobalStrike;
         const nifty50SpotTrade  =  [
          String(random9Digit()),
            new Date().toISOString(),
            (currentSpot + Math.random() * 1).toFixed(2),
            "0","0","0",
           (currentSpot + Math.random() * 2).toFixed(2),
            (currentSpot + Math.random() * 3).toFixed(2),
      (currentSpot + Math.random() * 1).toFixed(2),
      (currentSpot + Math.random() * 1.5).toFixed(2),
      Math.floor(1000000 + Math.random() * 9000000) + "",
      Math.floor(1000000 + Math.random() * 9000000) + "",
      "0","0","0","0","0"
    ];
        const  nifty50 = ["NIFTY-50" , ...nifty50SpotTrade ]; 
      //      ["NIFTY-50","753989892","2025-12-16T10:12:41.627Z","141.23","0","0","0","108.92","111.05","163.63","143.79","7019403","8814904","0","0","0","0","0"]
          initialtrade.push(nifty50);


        const uniqueMerged = [...new Set(initialtrade)];
          console.log(` Initial trades :`, JSON.stringify(uniqueMerged));
         console.log("[WSS] Subscribed & matched contracts:", ws.matching_contracts.length);
         // ✅ build custom symbollist
       /* const symbollist1 = [];
        const firstSymbol = symbols_const[0].symbol;
        symbollist1.push(firstSymbol);                 // "NIFTY25093025300PE"
        symbollist1.push([symbols_const[0].id]);       // ["302418032"]

        // then push id + symbol pairs
        symbols_const.slice(1).forEach(({ id, symbol }) => {
        symbollist1.push([firstSymbol, id]);         // ["NIFTY25093025300PE", "302418025"]
        });*/
        // build symbollist as [symbol, id] pairs
        const symbollist_pairs = Array.from(ws.subscribedSymbols.entries()).map(
                ([symbol, id]) => [symbol, id]
            );
      
    /* trades_k_const.forEach(({ id, symbol, k }) => {
         if (ws.subscribedSymbols.has(symbol)) {
         
              syml[i].concat(initialtrade)
      }});*/
      
        // Send mockEvent2 (symbols added)
        const mockEvent2 = {
          success: true,
          message: "symbols added",
          symbolsadded: request.symbols.length,
          symbollist:initialtrade,
          totalsymbolsubscribed: ws.subscribedSymbols.size
        };
        ws.send(JSON.stringify(mockEvent2));
        console.log("[WSS] Sent mockEvent2 (symbols added):", JSON.stringify(syml));
        // INVOLE the asLongSubscribedInterval
        //aslongSubscribedInterval();
        

 
     
     
     
     
     
     
      }
    } catch (err) {
      console.error("[WSS] Error parsing message:", err.message);
      ws.send(JSON.stringify({ success: false, message: "Invalid JSON" }));
    }
  });

 
  const trades_k_const = [

      /*  { id: "302418012", symbol: "NIFTY25O0724100CE", k: 180 },
    { id: "302418013", symbol: "NIFTY25O0724100PE", k: 40 },
    { id: "302418014", symbol: "NIFTY25O0724200PE", k: 360 },
    { id: "302418015", symbol: "NIFTY25O0724200CE", k: 60 },

    { id: "302418016", symbol: "NIFTY25O0724300CE", k: 180 },
    { id: "302418017", symbol: "NIFTY25O0724300PE", k: 40 },
    { id: "302418018", symbol: "NIFTY25O0724400PE", k: 360 },
    { id: "302418019", symbol: "NIFTY25O0724400CE", k: 60 },

     { id: "302418020", symbol: "NIFTY25O0724500CE", k: 180 },
    { id: "302418021", symbol: "NIFTY25O0724500PE", k: 40 },
    { id: "302418022", symbol: "NIFTY25O0724600PE", k: 360 },
    { id: "302418023", symbol: "NIFTY25O0724600CE", k: 60 },

    { id: "302418032", symbol: "NIFTY25O0724700CE", k: 180 },
    { id: "302418025", symbol: "NIFTY25O0724700PE", k: 40 },
    { id: "302418024", symbol: "NIFTY25O0724800PE", k: 360 },
    { id: "302418029", symbol: "NIFTY25O0724800CE", k: 60 } */
     { id: "302418011", symbol: "NIFTY-50", k: 2 },
      { id: "302418012", symbol: "NIFTY25D1624100CE", k: 180 },
    { id: "302518013", symbol: "NIFTY25D1625100PE", k: 40 },
    { id: "302418014", symbol: "NIFTY25D1625200PE", k: 360 },
    { id: "302418015", symbol: "NIFTY25D1625200CE", k: 60 },

    { id: "302418016", symbol: "NIFTY25D1625300CE", k: 180 },
    { id: "302418017", symbol: "NIFTY25D1625300PE", k: 40 },
    { id: "302418018", symbol: "NIFTY25D1625400PE", k: 360 },
    { id: "302418019", symbol: "NIFTY25D1625400CE", k: 60 },

     { id: "302418020", symbol: "NIFTY25D1625500CE", k: 180 },
    { id: "302418021", symbol: "NIFTY25D1625500PE", k: 40 },
    { id: "302418022", symbol: "NIFTY25D1625600PE", k: 360 },
    { id: "302518023", symbol: "NIFTY25D1625600CE", k: 60 },

    { id: "302418032", symbol: "NIFTY25D1625700CE", k: 180 },
    { id: "302418025", symbol: "NIFTY25D1625700PE", k: 40 },
    { id: "302418024", symbol: "NIFTY25D1625800PE", k: 360 },
    { id: "302418029", symbol: "NIFTY25D1625800CE", k: 60 },
    	
        { id: "302419032", symbol: "NIFTY25D1625900CE", k: 180 },
    { id: "302419025", symbol: "NIFTY25D1625900PE", k: 40 },
    { id: "302419024", symbol: "NIFTY25D1626000PE", k: 360 },
    { id: "302419029", symbol: "NIFTY25D1626000CE", k: 60 },
    			
    	 { id: "302420032", symbol: "NIFTY25D1626050CE", k: 180 },
    { id: "302420025", symbol: "NIFTY25D1626050PE", k: 40 },
    { id: "302420024", symbol: "NIFTY25D1626100PE", k: 360 },
     { id: "302420029", symbol: "NIFTY25D1626100CE", k: 60 },

    { id: "302430001", symbol: "NIFTY25D2325400CE", k: 12 },
  { id: "302430002", symbol: "NIFTY25D2325400PE", k: 18 },

  { id: "302430003", symbol: "NIFTY25D2325500CE", k: 22 },
  { id: "302430004", symbol: "NIFTY25D2325500PE", k: 28 },

  { id: "302430005", symbol: "NIFTY25D2325600CE", k: 35 },
  { id: "302430006", symbol: "NIFTY25D2325600PE", k: 42 },

  { id: "302430007", symbol: "NIFTY25D2325700CE", k: 48 },
  { id: "302430008", symbol: "NIFTY25D2325700PE", k: 52 },

  { id: "302430009", symbol: "NIFTY25D2325800CE", k: 55 },
  { id: "302430010", symbol: "NIFTY25D2325800PE", k: 58 },

  { id: "302430011", symbol: "NIFTY25D2325900CE", k: 60 },
  { id: "302430012", symbol: "NIFTY25D2325900PE", k: 63 },

  { id: "302430013", symbol: "NIFTY25D2326000CE", k: 65 },
  { id: "302430014", symbol: "NIFTY25D2326000PE", k: 68 },

  { id: "302430015", symbol: "NIFTY25D2326100CE", k: 70 },
  { id: "302430016", symbol: "NIFTY25D2326100PE", k: 72 },

  { id: "302430017", symbol: "NIFTY25D2326200CE", k: 75 },
  { id: "302430018", symbol: "NIFTY25D2326200PE", k: 78 },

  { id: "302430019", symbol: "NIFTY25D2326300CE", k: 82 },
  { id: "302430020", symbol: "NIFTY25D2326300PE", k: 85 },

  { id: "302430021", symbol: "NIFTY25D2326400CE", k: 90 },
  { id: "302430022", symbol: "NIFTY25D2326400PE", k: 95 },

    { id: "302440001", symbol: "NIFTY25D3025400CE", k: 12 },
  { id: "302440002", symbol: "NIFTY25D3025400PE", k: 18 },

  { id: "302440003", symbol: "NIFTY25D3025500CE", k: 22 },
  { id: "302440004", symbol: "NIFTY25D3025500PE", k: 28 },

  { id: "302440005", symbol: "NIFTY25D3025600CE", k: 35 },
  { id: "302440006", symbol: "NIFTY25D3025600PE", k: 42 },

  { id: "302440007", symbol: "NIFTY25D3025700CE", k: 48 },
  { id: "302440008", symbol: "NIFTY25D3025700PE", k: 52 },

  { id: "302440009", symbol: "NIFTY25D3025800CE", k: 55 },
  { id: "302440010", symbol: "NIFTY25D3025800PE", k: 58 },

  { id: "302440011", symbol: "NIFTY25D3025900CE", k: 60 },
  { id: "302440012", symbol: "NIFTY25D3025900PE", k: 63 },

  { id: "302440013", symbol: "NIFTY25D3026000CE", k: 65 },
  { id: "302440014", symbol: "NIFTY25D3026000PE", k: 68 },

  { id: "302440015", symbol: "NIFTY25D3026100CE", k: 70 },
  { id: "302440016", symbol: "NIFTY25D3026100PE", k: 72 },

  { id: "302440017", symbol: "NIFTY25D3026200CE", k: 75 },
  { id: "302440018", symbol: "NIFTY25D3026200PE", k: 78 },

  { id: "302440019", symbol: "NIFTY25D3026300CE", k: 82 },
  { id: "302440020", symbol: "NIFTY25D3026300PE", k: 85 },

  { id: "302440021", symbol: "NIFTY25D3026400CE", k: 90 },
  { id: "302440022", symbol: "NIFTY25D3026400PE", k: 95 },

   { id: "302449999", symbol: "NIFTY26J0625400CE", k: 12 },
  { id: "302450000", symbol: "NIFTY26J0625400PE", k: 18 },

     { id: "302450001", symbol: "NIFTY26J0625500CE", k: 13 },
  { id: "302450002", symbol: "NIFTY26J0625500PE", k: 23 },
     { id: "302450003", symbol: "NIFTY26J0625600CE", k: 15 },
  { id: "302450004", symbol: "NIFTY26J0625600PE", k: 21 },
   { id: "302450005", symbol: "NIFTY26J0625700CE", k: 44 },
  { id: "302450006", symbol: "NIFTY26J0625700PE", k: 11 },

   { id: "302450007", symbol: "NIFTY26J0625800CE", k: 54 },
  { id: "302450008", symbol: "NIFTY26J0625800PE", k: 62 },

    { id: "302450009", symbol: "NIFTY26J0625900CE", k: 44 },
  { id: "302450010", symbol: "NIFTY26J0625900PE", k: 11 },

      { id: "302450011", symbol: "NIFTY26J0626000CE", k: 44 },
  { id: "302450012", symbol: "NIFTY26J0626000PE", k: 11 },
  { id: "302450013", symbol: "NIFTY26J0626100CE", k: 44 },
  { id: "302450014", symbol: "NIFTY26J0626100PE", k: 11 },
  { id: "302450015", symbol: "NIFTY26J0626200CE", k: 44 },
  { id: "302450016", symbol: "NIFTY26J0626200PE", k: 11 },
    { id: "302450017", symbol: "NIFTY26J0626300CE", k: 44 },
  { id: "302450018", symbol: "NIFTY26J0626300PE", k: 11 },


  { id: "302450021", symbol: "NIFTY26J0626400CE", k: 90 },
  { id: "302450022", symbol: "NIFTY26J0626400PE", k: 95 },
 // 13 
 { id: "302459999", symbol: "NIFTY26J1325400CE", k: 12 },
  { id: "302460000", symbol: "NIFTY26J1325400PE", k: 18 },

    { id: "302460001", symbol: "NIFTY26J1325500CE", k: 13 },
  { id: "302460002", symbol: "NIFTY26J1325500PE", k: 23 },
     { id: "302460003", symbol: "NIFTY26J1325600CE", k: 15 },
  { id: "302460004", symbol: "NIFTY26J1325600PE", k: 21 },
   { id: "302460005", symbol: "NIFTY26J1325700CE", k: 44 },
  { id: "302460006", symbol: "NIFTY26J1325700PE", k: 11 },

   { id: "302460007", symbol: "NIFTY26J1325800CE", k: 54 },
  { id: "302460008", symbol: "NIFTY26J1325800PE", k: 62 },

    { id: "302460009", symbol: "NIFTY26J1325900CE", k: 44 },
  { id: "302460010", symbol: "NIFTY26J1325900PE", k: 11 },

      { id: "302460011", symbol: "NIFTY26J1326000CE", k: 44 },
  { id: "302460012", symbol: "NIFTY26J1326000PE", k: 11 },
  { id: "302460013", symbol: "NIFTY26J1326100CE", k: 44 },
  { id: "302460014", symbol: "NIFTY26J1326100PE", k: 11 },
  { id: "302460015", symbol: "NIFTY26J1326200CE", k: 44 },
  { id: "302460016", symbol: "NIFTY26J1326200PE", k: 11 },
    { id: "302460017", symbol: "NIFTY26J1326300CE", k: 44 },
  { id: "302460018", symbol: "NIFTY26J1326300PE", k: 11 },


  { id: "302460021", symbol: "NIFTY26J1326400CE", k: 90 },
  { id: "302460022", symbol: "NIFTY26J1326400PE", k: 95 },
//20
    { id: "302469999", symbol: "NIFTY26J2025400CE", k: 12 },
  { id: "302470000", symbol: "NIFTY26J2025400PE", k: 18 },
//--
{ id: "302470001", symbol: "NIFTY26J2025400CE", k: 12 },
  { id: "302470002", symbol: "NIFTY26J2025400PE", k: 18 },

    { id: "302470001", symbol: "NIFTY26J2025500CE", k: 13 },
  { id: "302470002", symbol: "NIFTY26J2025500PE", k: 23 },
     { id: "302470003", symbol: "NIFTY26J2025600CE", k: 15 },
  { id: "302470004", symbol: "NIFTY26J2025600PE", k: 21 },
   { id: "302470005", symbol: "NIFTY26J2025700CE", k: 44 },
  { id: "302470006", symbol: "NIFTY26J2025700PE", k: 11 },

   { id: "302470007", symbol: "NIFTY26J2025800CE", k: 54 },
  { id: "302470008", symbol: "NIFTY26J2025800PE", k: 62 },

    { id: "302470009", symbol: "NIFTY26J2025900CE", k: 44 },
  { id: "302470010", symbol: "NIFTY26J2025900PE", k: 11 },

      { id: "302470011", symbol: "NIFTY26J2026000CE", k: 44 },
  { id: "302470012", symbol: "NIFTY26J2026000PE", k: 11 },
  { id: "302470013", symbol: "NIFTY26J2026100CE", k: 44 },
  { id: "302470014", symbol: "NIFTY26J2026100PE", k: 11 },
  { id: "302470015", symbol: "NIFTY26J2026200CE", k: 44 },
  { id: "302470016", symbol: "NIFTY26J2026200PE", k: 11 },
    { id: "302470017", symbol: "NIFTY26J2026300CE", k: 44 },
  { id: "302470018", symbol: "NIFTY26J2026300PE", k: 11 },
//--
  { id: "302470021", symbol: "NIFTY26J2026400CE", k: 90 },
  { id: "302470022", symbol: "NIFTY26J2026400PE", k: 95 },

  //30
      { id: "302479999", symbol: "NIFTY26J2725400CE", k: 12 },
  { id: "302480000", symbol: "NIFTY26J2725400PE", k: 18 },

{ id: "302480001", symbol: "NIFTY26J2725400CE", k: 12 },
  { id: "302480002", symbol: "NIFTY26J2725400PE", k: 18 },

    { id: "302480001", symbol: "NIFTY26J2725500CE", k: 13 },
  { id: "302480002", symbol: "NIFTY26J2725500PE", k: 23 },
     { id: "302480003", symbol: "NIFTY26J2725600CE", k: 15 },
  { id: "302480004", symbol: "NIFTY26J2725600PE", k: 21 },
   { id: "302480005", symbol: "NIFTY26J2725700CE", k: 44 },
  { id: "302480006", symbol: "NIFTY26J2725700PE", k: 11 },

   { id: "302480007", symbol: "NIFTY26J2725800CE", k: 54 },
  { id: "302480008", symbol: "NIFTY26J2725800PE", k: 62 },

    { id: "302480009", symbol: "NIFTY26J2725900CE", k: 44 },
  { id: "302480010", symbol: "NIFTY26J2725900PE", k: 11 },

      { id: "302480011", symbol: "NIFTY26J2726000CE", k: 44 },
  { id: "302480012", symbol: "NIFTY26J2726000PE", k: 11 },
  { id: "302480013", symbol: "NIFTY26J2726100CE", k: 44 },
  { id: "302480014", symbol: "NIFTY26J2726100PE", k: 11 },
  { id: "302480015", symbol: "NIFTY26J2726200CE", k: 44 },
  { id: "302480016", symbol: "NIFTY26J2726200PE", k: 11 },
    { id: "302480017", symbol: "NIFTY26J2726300CE", k: 44 },
  { id: "302480018", symbol: "NIFTY26J2726300PE", k: 11 },


  { id: "302480021", symbol: "NIFTY26J2726400CE", k: 90 },
  { id: "302480022", symbol: "NIFTY26J2726400PE", k: 95 },
    
  ];
 


  // === 5. Send trades every 2s for subscribed symbols ===
  /*const tradeInterval = setInterval(() => {
   console.log('generating  trades ')
    matching_contracts.forEach(({ id, symbol, k }) => {
      if (ws.subscribedSymbols.has(symbol)) {
        const trade = generateTrade(id, k);
        ws.send(JSON.stringify({ trade }));
        console.log(`[WSS] Sent trade for ${symbol}:`, trade[2]);
      }
    });
    if(Array.isArray(matching_contracts) && matching_contracts.length > 0 ){

    }else {
       console.log(' matching records to generate trades is not available  ')
    }
  }, 2000);
   */
     //5. Send trades every 2s for subscribed symbols ===
      // 2. Trade generator for THIS client
  const tradeInterval = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;

    if (Array.isArray(ws.matching_contracts) && ws.matching_contracts.length > 0) {
      ws.matching_contracts.forEach(({ id, symbol, k }) => {
        if (ws.subscribedSymbols.has(symbol)) {
          const trade = generateTrade(id, k);
          ws.send(JSON.stringify({ trade }));
          console.log(`[WSS] Sent trade for ${symbol}:`, trade[2]);
        }
      }
      );
        // send the NIFTY-50 default trade 
         /* const trade =   [
              id,
              new Date().toISOString(),
              (k_const + Math.random() * 70).toFixed(2),
              "0","0","0",
              (k_const + Math.random() * 70).toFixed(2),
              (k_const + Math.random() * 70).toFixed(2),
              (k_const + Math.random() * 70).toFixed(2),
              (k_const + Math.random() * 70).toFixed(2),
              Math.floor(1000000 + Math.random() * 9000000) + "",
              Math.floor(1000000 + Math.random() * 9000000) + "",
              "0","0","0","0","0"
          ]; */
           let currentSpot =  baseGlobalStrike; 
           // variable name must be trade else client sees nifty50SpotTrade
         const trade  =  [
                String(random9Digit()),
                  new Date().toISOString(),
                  (currentSpot + Math.random() * 1).toFixed(2),
                  "0","0","0",
                (currentSpot + Math.random() * 2).toFixed(2),
                  (currentSpot + Math.random() * 3).toFixed(2),
            (currentSpot + Math.random() * 1).toFixed(2),
            (currentSpot + Math.random() * 1.5).toFixed(2),
            Math.floor(1000000 + Math.random() * 9000000) + "",
            Math.floor(1000000 + Math.random() * 9000000) + "",
            "0","0","0","0","0"
           ];
          ws.send(JSON.stringify({ trade }));

    } else {
      console.log("[WSS] No matching records for this client");
    }
  }, 2000);






  // === 6. Cleanup on disconnect ===
  ws.on("close", () => {
    console.log("[WSS] Client disconnected.");
    clearInterval(heartbeatInterval);
    clearInterval(tradeInterval);
    clearInterval(aslongSubscribedInterval);
  });
});

// Use Render’s PORT (default to 3000 locally)
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ WebSocket endpoint: wss://<your-app>.onrender.com`);
});
const expiries = [
  { code: "D16", label: "DEC16" },
  { code: "D23", label: "DEC23" },
  { code: "D30", label: "DEC30" },
  { code: "J06", label: "JAN06" },
  { code: "J13", label: "JAN13" },
  { code: "J20", label: "JAN20" },
  { code: "J27", label: "JAN27" },
];

const strikes = Array.from({ length: 11 }, (_, i) => 25400 + i * 100);

const OPTION_CHAIN = expiries.flatMap(exp =>
  strikes.flatMap(strike => ([
    {
      id: `${exp.label}_${strike}_CE`,
      symbol: `NIFTY25${exp.code}${strike}CE`,
      k: 180,
      type: "CE",
      strike,
      expiry: exp.label
    },
    {
      id: `${exp.label}_${strike}_PE`,
      symbol: `NIFTY25${exp.code}${strike}PE`,
      k: 40,
      type: "PE",
      strike,
      expiry: exp.label
    }
  ]))
);


/*server.listen(port,"0.0.0.0", () => {
  console.log(`✅ Mock WSS server running at wss://localhost:${port}`);
});*/


