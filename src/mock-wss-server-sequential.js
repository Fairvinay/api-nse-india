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
 import {loadSymbols , search  } from './csvworker-processor-new.mjs';
//import {fetchNiftySpot    } from './stocknse-india-new.mjs';
import {fetchNiftySpot    } from './stocknse-india-ultrafast.mjs';
import { isTodayFOHoliday , fetchWithRetry , API_URL ,  adjustExpiryAndRebuild , adjustForHoliday } from "./holiday.mjs";



process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 UNHANDLED REJECTION:", reason);
});

process.on("warning", (warning) => {
  console.warn("⚠️ Node Warning:", warning);
});

// ########################################################################################   AUXILARY FUNCTIONS 
async function safeExecute(fn, name = "task", retries = 5) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`▶️ ${name} attempt ${i}`);
      return await fn();
    } catch (err) {
      console.error(`❌ ${name} failed (attempt ${i}):`, err.message);

      if (i === retries) {
        console.error(`🚨 ${name} failed after ${retries} retries`);
        return null; // DO NOT THROW → prevents crash
      }

      await new Promise(r => setTimeout(r, 1000 * i)); // backoff
    }
  }
}
async function retryForever(fn, name, delay = 3000) {
  while (true) {
    try {
      console.log(`🔁 ${name} starting...`);
      const result = await fn();

      if (result) {
        console.log(`✅ ${name} successful`);
        return result;
      }

      console.log(`⚠️ ${name} returned empty, retrying...`);
    } catch (err) {
      console.error(`❌ ${name} failed:`, err.message);
    }

    await new Promise(r => setTimeout(r, delay));
  }
}
// ######################################################################################################## AUXILARY FUNCTIONS 




let  totalSymbols = [];   // TOTAL NIFTY , SENSEX , BANKNIFTY SYMBOLS 
let expiryObjects =[];
let tuesdayObjects = [];

// Build expiry → trades map
let current_month_nifty_expiries = {};
let current_month_nifty_expiries_truedata = {};
let total_array_expiries = [] ;
let total_array_expiries_truedata = [] ;



    const app = express();
// normal REST route (Render needs this for health check)
app.get("/", (req, res) => {
  res.send("WebSocket server is up ✅");
});
app.get("/recalculate-option-strikes", async (req, res) => {
  try {
    let authHeader =
      req.headers["auth_code"] ||
      req.headers["Auth_code"] ||
      req.headers["Authorization"] ||
      req.headers["x-auth-token"];
    if (!authHeader) {
      return res.status(401).json({
        error: "auth_code/Auth_code/x-auth-token/Authorization header missing"
      });
    }
    const token = authHeader.split(" ")[1] || authHeader;
    if (!token) {
      return res.status(401).json({ error: "Bearer token missing" });
    }
    console.log("Received Token:", token);
    // 🚀 WAIT for full engine completion
    await initOptionEngine(token);
    // 🚀 Sort expiries after generation
    total_array_expiries = sortExpiries(total_array_expiries);
    const datNow = new Date().toISOString();
    console.log("Recalculation completed:", datNow);
    console.log("Total expiries:", total_array_expiries.length);
    res.json(total_array_expiries); 
     /* 
       res.json({
      expiries: current_month_nifty_expiries,
      truedata: current_month_nifty_expiries_truedata
    });	 
     */
    
  } catch (err) {
    console.error("Recalculate Option Strikes Error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message
    });
  }
});

const startOfMonth = new Date();
// Create HTTP server
const server = http.createServer(app);
// Load self-signed certificate
/*const server = https.createServer({
  cert: fs.readFileSync("./ssl.crt/server.crt"),
  key: fs.readFileSync("./ssl.key/server.key")
});*/

function getTuesdaysOfMonth(year, monthIndex , day,   holidaysFO) {
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
       console.log(" furture day "+date.toString());
     //   if (date.getDay() >= day || date.getDate() >= 30 ){
        if (date.getDay() >= day || date.getDate() >= startOfMonth.getDate() ){
        	  console.log("Adding tuesday "+ day+ " being aded "+date.toString());
        	   // ✅ 🔥 FIX: Adjust holiday here
             let adjustedDate = adjustForHoliday(date, holidaysFO);
        	  console.log("Original Tuesday:", date.toString());
             console.log("Adjusted Expiry:", adjustedDate.toString());
         
            tuesdays.push(new Date(adjustedDate)); 
        }
     }
    date.setDate(date.getDate() + 7);
  }
  console.log("getTuesdays before return "+JSON.stringify(tuesdays));
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
const monthCodesNew = { Jan:1, 
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: "O", // Letter O
  Nov: "N",
  Dec: "D"
};
const monthCodesNewMap = new Map([ ["Jan", 1],
  ["Feb", 2],
  ["Mar", 3],
  ["Apr", 4],
  ["May", 5],
  ["Jun", 6],
  ["Jul", 7],
  ["Aug", 8],
  ["Sep", 9],
  ["Oct", "O"],
  ["Nov", "N"],
  ["Dec", "D"]
]);
const valueToMonthMap = new Map([
   [0, "1"],[1, "2"],
  [2, "3"],
  [3, "4"],
  [4, "5"],
  [5, "6"],
  [6, "7"],
  [7, "8"],
  [8, "9"],
     
  [9, "O"],
  [10, "N"],
  [11, "D"],
  	    
  ["O", "Oct"],
  ["N", "Nov"],
  ["D", "Dec"]
]);
// Proper month codes
const monthProperCodes = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];
 let baseGlobalStrike = 25600;


/**
 * Robust date formatter to convert long date strings to YYMMDD
 * @param {Date|string} dateInput 
 * @returns {string} Formatted date as YYMMDD
 */
const formatToYYMMDD = (dateInput) => {
  try {
    const d = new Date(dateInput);
    
    // Check for invalid date
    if (isNaN(d.getTime())) return "Invalid";

    const year = d.getFullYear().toString().slice(-2); // Get last 2 digits
   //const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed this is TRUE DATA 
    const month = monthCodes[d.getMonth()];         // 3-letter month// Months are 0-indexed this is TRUE DATA 
    //const month =  valueToMonthMap.get(d.getMonth());
    console.log("formatToYYMMDD ",month);
    const day = d.getDate().toString().padStart(2, '0');

    return `${year}${month}${day}`;
  } catch (error) {
    return "Error";
  }
};


/**
 * Generate short expiry code from a Date
 * Example: Date(2025-10-07) → "25OCT07"
 */
function getShortYYMMDD(dateInput) {

 const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);

  if ( !(date instanceof Date) ||  !isNaN(date.getTime())) {
    // throw new Error(`Invalid date: ${dateInput} `);
         console.log("getShortYYMMDD found invalid date " , dateInput); 
           return 
  }

  const yy = String(date.getFullYear()).slice(-2);   // last 2 digits of year
  //const mCode = monthCodes[date.getMonth()];         // 3-letter month
    const mCode =  valueToMonthMap.get(date.getMonth());         // 3-letter month
     console.log("getShortYYMMDD ",mCode);
  const dd = String(date.getDate()).padStart(2, "0"); // 2-digit day
  return `${yy}${mCode}${dd}`;
}

/**
 * Generate short expiry code from a Date
 * Example: Date(2025-10-07) → "251007"
 */
function getShortYYMMDDDigits(dateInput) {

 const date = dateInput !== undefined && (dateInput instanceof Date) ? dateInput : new Date(dateInput);

  /*if (!(date instanceof Date) || !isNaN(date.getTime())) {
    //throw new Error(`Invalid date: ${dateInput}`);
         console.log("getShortYYMMDDDigits found invalid date " , dateInput); 
      return ; 
  }
 
  const yy = String(date.getFullYear()).slice(-2);   // last 2 digits of year
  const mCode =  date.getMonth()+1 < 10 ?   `0` + date.getMonth()+1 :  date.getMonth()+1 ;         // 3-letter month
  const dd = String(date.getDate()).padStart(2, "0"); // 2-digit day
  return `${yy}${mCode}${dd}`;*/

   try { 
    const d = new Date(dateInput);
          // Check for invalid date
    if (isNaN(d.getTime())) return "Invalid";

    const year = d.getFullYear().toString().slice(-2); // Get last 2 digits
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = d.getDate().toString().padStart(2, '0');

    return `${year}${month}${day}`;

   } 
   catch(er){
        return `380105`; /// future date 
    }




}




function formatTuesday(date) {
const datein = date !==undefined && (date instanceof Date) ? new Date(date) : "";
  if(datein ===""){
     console.log("format failed provide a proper date ");
     return;
   }
  const yy = String(datein.getFullYear()).slice(-2);
  const mCode = monthCodes[datein.getMonth()];
  const dd = String(datein.getDate()).padStart(2, "0");
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



//console.log("First Tuesday of October 2025:", formatTuesday(tuesdays[0]));
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

/**
 * Generate a random 9-digit integer
 */
function random9Digit() {
  return Math.floor(100000000 + Math.random() * 900000000);
}
function getBaseFloor(num) {
  if (isNaN(num)) return 23000; // safeguard
  return Math.floor(num / 100) * 100;
}
async function getNitfySpot(access_token) {
  try {
       const result = await safeExecute(
           () => fetchNiftySpot(access_token),
                 "Fetch NIFTY Spot"
         );


    const nifty =result; //await fetchNiftySpot(access_token);
    console.log("📈 NIFTY SPOT =", nifty);
    let spotNifty =23000;
    //check nifty is object or number 
    try {
    if (nifty && typeof nifty === "object" && nifty.value != null) {
      const val = Number(nifty.value);

      if (!isNaN(val) && val > 0) {
        spotNifty = val;
      }
    } 
    else {
      const val = Number(nifty);

      if (!isNaN(val) && val > 0) {
        spotNifty = val;
      }
    }

  } catch (err) {
    console.log("❌ Spot parse error, defaulting =", spotNifty);
  }
   const rounded = Math.round(spotNifty);
 // const baseStrike = getBaseFloor(rounded);
     baseGlobalStrike =  getBaseFloor(rounded);  //getBaseFloor(Math.round(spotNifty  )  )   ; // optional ATM rounding

    return baseGlobalStrike;

  } catch (err) {
    console.error("Error fetching NIFTY:", err.message);
    return baseGlobalStrike; // fallback
  }
}
/*
async function getNitfySpot () { 
	
	     (async () => {
                            try {
                              const nifty = await fetchNiftySpot();
                                console.log("📈 NIFTY SPOT =", nifty);
                              baseGlobalStrike =    nifty;
                            } catch (err) {
                                console.error(err.message);
                            }
                          })();
	 
}*/


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
  baseStrike = 24600, //26100,      // this needs to be categorised as configuration object or setting , others are at line 285 1276 
  steps = 15,   // this is for 7 strike prices lsiting 
  stepSize = 100,
  weeklyInterestRate = 15
) {
  const result = {};
    if (!Array.isArray(expiries)) {
    console.log("❌ expiries is not array");
    return result;
  }


  expiries.forEach(exp => {


         if (!exp || typeof exp.shortKey !== "string") {
      console.log("❌ Skipping invalid expiry:", exp);
      return;
    }




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
 


 async function initOptionEngine(access_token) {
   return await safeExecute(async () => {
  // 🔴 reset global arrays before regeneration
        total_array_expiries = [];
        total_array_expiries_truedata = [];
         current_month_nifty_expiries = [];
        current_month_nifty_expiries_truedata = [];
        
        const spot = await getNitfySpot(access_token);

        console.log("Using Base Strike:", spot);

        current_month_nifty_expiries =
            generateTrades(expiryObjects, spot - 300);

        current_month_nifty_expiries_truedata =
            generateTuesdayTrades(tuesdayObjects, spot - 300);
  
        // 🔵 sort immediately
        current_month_nifty_expiries =
            sortExpiryTrades(current_month_nifty_expiries);

        current_month_nifty_expiries_truedata =
            sortExpiryTrades(current_month_nifty_expiries_truedata);
        console.log("current_month_nifty_expiries :: "+ JSON.stringify(current_month_nifty_expiries));
          const holidayData = await safeExecute(
            () => fetchWithRetry(API_URL),
            "Holiday Reload"
          );

          const holidaysFO = holidayData?.FO || [];

        const adjustedExpiries = adjustExpiryAndRebuild(
          total_array_expiries,
          holidaysFO
        );
          console.log("adjustedExpiries :: "+ JSON.stringify(adjustedExpiries));
         if (!isFirstKeyEmptyArray(adjustedExpiries)) {
            total_array_expiries =
                sortExpiryTrades(adjustedExpiries);
         }
          if (!isFirstKeyEmptyArray(adjustedExpiries)) {
            total_array_expiries_truedata =
                sortExpiryTrades(total_array_expiries_truedata);
          }
        console.log("Option engine recalculated and sorted.");
        console.log("Option engine recalculated successfully.");
         console.log("total_array_expiries :: "+ JSON.stringify(total_array_expiries));
     }, "initOptionEngine");
    
}
function isFirstKeyEmptyArray(obj) {
  if (!obj || typeof obj !== "object") return true;

  const keys = Object.keys(obj);

  if (keys.length === 0) return true;

  const firstKey = keys[0];
  const value = obj[firstKey];

  return Array.isArray(value) && value.length === 0;
}

function sortExpiryTrades(expiryMap) {
  if (!expiryMap || typeof expiryMap !== "object") return {};

  const sortedMap = {};

  for (const expiryKey of Object.keys(expiryMap)) {
    const trades = expiryMap[expiryKey];

    if (!Array.isArray(trades)) {
      sortedMap[expiryKey] = [];
      continue;
    }

    sortedMap[expiryKey] = trades.sort((a, b) => {
      try {
        // Handle NIFTY-50 separately (keep at end)
        if (a.symbol === "NIFTY-50") return 1;
        if (b.symbol === "NIFTY-50") return -1;

        // Extract strike price (last 5 digits before CE/PE)
        const strikeA = extractStrike(a.symbol);
        const strikeB = extractStrike(b.symbol);

        // 1️⃣ Sort by strike (numeric)
        if (strikeA !== strikeB) {
          return strikeA - strikeB;
        }

        // 2️⃣ For same strike → CE first, then PE
        if (a.symbol.endsWith("CE") && b.symbol.endsWith("PE")) return -1;
        if (a.symbol.endsWith("PE") && b.symbol.endsWith("CE")) return 1;

        return 0;
      } catch (err) {
        console.log("Sort error:", err.message);
        return 0;
      }
    });
  }

  return sortedMap;
}
function extractStrike(symbol) {
  if (!symbol) return 0;

  // Matches last 5 digits before CE/PE
  const match = symbol.match(/(\d{5})(CE|PE)$/);

  if (match) {
    return parseInt(match[1], 10);
  }

  return 0; // fallback
}


function sortExpiries(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.sort((a, b) => {
    const expA = a[0];
    const expB = b[0];
    return expA.localeCompare(expB);
  });
}

function waitForExpiryObjects(timeout = 10000, interval = 200) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      try {
        if (Array.isArray(expiryObjects) && expiryObjects.length > 0) {
          console.log("✅ expiryObjects is ready");
          return resolve(true);
        }

        if (Date.now() - start > timeout) {
          return reject(new Error("❌ Timeout waiting for expiryObjects"));
        }

        setTimeout(check, interval);
      } catch (err) {
        reject(err);
      }
    };

    check();
  });
}



/*
current_month_nifty_expiries = generateTrades(expiryObjects,baseGlobalStrike);
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
*/
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
function extractExpiryStrikeMapNew(dataEntries, isFyers) {
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
const fyersStrikeMapOld = extractExpiryStrikeMap(
  total_array_expiries,
  true
);
const fyersStrikeMap = extractExpiryStrikeMapNew(
  total_array_expiries,
  true
);

const truedataStrikeMap = extractExpiryStrikeMap(
  total_array_expiries_truedata,
  false
);




const extractExpiryFromSymbolOld = (symbol) => {
  // FYERS: NIFTY25D0225600CE → 25D02
  const fyersMatch = symbol.match(/NIFTY(\d{2}D\d{2})/);
  if (fyersMatch) return fyersMatch[1];

  // TrueData: NIFTY25120225600CE → 251202
  const truedataMatch = symbol.match(/NIFTY(\d{6})/);
  if (truedataMatch) return truedataMatch[1];

  return null;
};
const extractExpiryFromSymbol = (symbol) => {
  // FYERS: NIFTY25D0225600CE → 25D02
 let fyersMatch = symbol.match(/NIFTY(\d{5})/);
   if (! symbol.startsWith("NIFTY")) { 
      if (! symbol.includes("CE") && ! symbol.includes("PE"))  { 
       let kq , kl = "";
      // Extract strike
      
      const strike =  ( kq =  symbol.match(/(NIFTY\d{10})/) ?  symbol.match(/(NIFTY\d{10})/)[1] : "" ) // : 
      //  ( kl = symbol.match(/NIFTY\d{6}(\d{5})/) ?  symbol.match(/NIFTY\d{6}(\d{5})/)[1] : ""));
        console.log('symbol  ' + symbol + 'fyers strike ', strike)
       fyersMatch = strike ;
         console.log('fyers match ', fyersMatch); 
          return fyersMatch ;
      }
   }
  if (fyersMatch) {    console.log('fyers extract ', fyersMatch); // "26106"
    return fyersMatch[1]   } ;

  // TrueData: NIFTY25120225600CE → 251202
  const truedataMatch = symbol.match(/NIFTY(\d{6})/);
  if (truedataMatch)  {    console.log('truedata extract ', truedataMatch); // "26106"
    return truedataMatch[1] } ;

  return null;
};

const extractExpiryFromSymbolTrue = (symbol) => {
 
  

  // TrueData: NIFTY25120225600CE → 251202
  const truedataMatch = symbol.match(/NIFTY(\d{6})/);
  if (truedataMatch)  {    console.log('truedata extract ', truedataMatch); // "26106"
    return truedataMatch[1] } ;

  return null;
};






async function runFNO() {
  try {
    console.log("Fetching Symbols FNO data...");
    // Await the result of the async function
    const data = await loadSymbols();
    totalSymbols = data;
    console.log("Received: total "+data.length +" Symbols from Fyers ");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

 
    


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

async function prepareExpiryData() {
  const holidayData = await fetchWithRetry(API_URL);

  const holidaysFO = holidayData?.FO || [];

  let tuesdays = getTuesdaysOfMonth(
    currentYear,
    currentMonthIndex,
    currentMonthDay,
    holidaysFO
  );

  tuesdays = tuesdays.concat(
    caculateTuesdayOfNextMonth(isLastMonthofYear)
  );

  tuesdays = tuesdays.filter(Boolean);

  console.log("All Tuesdays:", tuesdays.map(formatTuesday));

  const current_month_expiries = tuesdays;

  expiryObjects = current_month_expiries.map(d => ({
    date: d,
    shortKey: formatToYYMMDD(d)
  }));

  tuesdayObjects = current_month_expiries.map((d, indx) => ({
    date: getShortYYMMDDDigits(d),
    shortKey: indx
  }));

  console.log("Expiry objects prepared:", expiryObjects.length);

  return true;
}

//let total_expiry_keyCombinator = [ total_array_expiries.]
// Start HTTPS server8443
// 8888 for the fyers.web.in/scalper_terminal 
//let port = 8443;

// Create an HTTPS server
/*let server  =    https.createServer(options, app).listen(port, () => {
        console.log(`HTTPS server running on port ${port}`);
        console.log(`✅ Mock WSS server running at wss://localhost:${port}`);
    });
*/

// Create WebSocket server over HTTPS
//const wss = new WebSocketServer({ server });// new WebSocket.Server({ server });



 

async function ensureOptionEngineReady() {
  await initOptionEngine();

  if (
    !Array.isArray(total_array_expiries) ||
    total_array_expiries.length === 0
  ) {
    console.log("❌ Option engine produced no trades");
    return false;
  }

  console.log(
    "✅ Trades generated:",
    total_array_expiries.length
  );

  return true;
}






async function bootstrap() {
  console.log("🚀 Starting application bootstrap...");

  // 1. Wait forever until holiday API works
  await retryForever(
    prepareExpiryData,
    "Holiday + Expiry preparation"
  );

  // 2. Wait forever until option engine produces trades
  await retryForever(
    ensureOptionEngineReady,
    "Option Engine Initialization"
  );

  console.log("🎯 Engine ready. Starting server...");
  // 2a. Check and verify the Fyers expiries 
   
      let expiryKeyMap = {};


      Object.entries(total_array_expiries).forEach(([fyersKey, fyersArr]) => {
        if (!fyersArr?.length) return;

        const fyersSymbol = fyersArr[1] [0];
        console.log(" fyersSymbol[`symbol`] ", JSON.stringify(fyersSymbol["symbol"]));
        const fyersExpiry = extractExpiryFromSymbol(fyersSymbol["symbol"] ? fyersSymbol["symbol"] : "");
        console.log(" fyersExpiry ", JSON.stringify(fyersExpiry));

        Object.entries(total_array_expiries_truedata).forEach(
          ([trueKey, trueArr]) => {
            if (!trueArr?.length) return;

            const trueSymbol = trueArr[1] [0]; //.symbol;
            const trueExpiry = extractExpiryFromSymbolTrue(trueSymbol["symbol"] ? trueSymbol["symbol"] : "" );
            console.log(" trueExpiry ", JSON.stringify(trueExpiry));
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
      //console.log(" Using Regex fetched the keys from true_array_expiries and true_array_expiries_truedata  : symbol.match(/NIFTY(\d{2}D\d{2})/)  FYERS: NIFTY25D0225600CE → 25D02 and /NIFTY(\d{6})/ TrueData: NIFTY25120225600CE → 251202 ");
      console.log(" Using Regex fetched the keys from true_array_expiries and true_array_expiries_truedata  : symbol.match(/NIFTY(\d{5})/)  FYERS: NIFTY26J0625600CE → 26106  NIFTY25D0225600CE → 25D02 and /NIFTY(\d{6})/ TrueData: NIFTY25120225600CE → 251202 ");
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









  // 3. Load symbols
  await runFNO();
   console.log(" INITIALISING  for FNO symbols available " );
    (async () => { 
      
           await  runFNO();
           let tx = "SENSEX 12 Mar";
            console.log("Searching for ", tx, "  in", totalSymbols.length, "...");
            const test =  await search("SENSEX 12 Mar" , totalSymbols);
           console.log("Search test results:", test.length, "found in", test.time, "ms");
           if(Array.isArray(test.results)){
             test.results.forEach((sr) => { 
                console.log("record --> ",  JSON.stringify(sr));

             });
           }

    })();
  // 4. Start server ONLY now
  startServer();
}

function startServer() {
              //let total_expiry_keyCombinator = [ total_array_expiries.]
              // Start HTTPS server8443
              // 8888 for the fyers.web.in/scalper_terminal 
              let port = 8443;

              // Create an HTTPS server


              let server  =    https.createServer(options, app).listen(port, () => {
                      console.log(`HTTPS server running on port ${port}`);
                      console.log(`✅ Mock WSS server running at wss://localhost:${port}`);
                  });

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
                  
                      const symbollist_pairs = Array.from(ws.subscribedSymbols.entries()).map(
                              ([symbol, id]) => [symbol, id]
                          );
                    
                 
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


}  /// startServer () 
 
bootstrap();

/*// Use Render’s PORT (default to 3000 locally)
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ WebSocket endpoint: wss://<your-app>.onrender.com`);
});*/
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


