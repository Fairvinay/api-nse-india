


export const API_URL = "https://feedsmain.onrender.com/api/holidays"; // "https://artilleryfeed2.onrender.com/api/holidays"; "https://scraper-api-eyiz.onrender.com/api/holidays";

// Retry wrapper
export  async function fetchWithRetry(url, retries = 3, timeout = 5000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, { signal: controller.signal });

      clearTimeout(id);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error(`❌ Attempt ${i} failed:`, err.message);

      if (i === retries) throw err;

      // small delay before retry
      await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
}


function formatDateToAPI(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[date.getMonth()];

  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}
export async function isTodayFOHoliday() {
  try {
    const data = await fetchWithRetry(API_URL, 3);

    if (!data || !data.FO) {
      throw new Error("Invalid API response: FO missing");
    }

    const todayStr = formatDateToAPI(new Date());

    const holiday = data.FO.find(h => h.tradingDate === todayStr);

    if (holiday) {
      console.log("🚫 Today is a holiday:", holiday.description);
      return {
        isHoliday: true,
        reason: holiday.description
      };
    }

    console.log("✅ Today is NOT a holiday");
    return {
      isHoliday: false
    };

  } catch (err) {
    console.error("🔥 Holiday check failed:", err.message);

    // SAFE FALLBACK → Assume NOT holiday (or change as per your risk)
    return {
      isHoliday: false,
      error: true
    };
  }
}
const MONTH_MAP = {
  F: "Jan",
  G: "Feb",
  M: "Mar",
  A: "Apr",
  Y: "May",
  J: "Jun",
  U: "Jul",
  Q: "Aug",
  V: "Sep",
  O: "Oct",
  N: "Nov",
  D: "Dec"
};



function parseSymbolToDate(symbol) {
  const match = symbol.match(/NIFTY(\d{2})([A-Z])(\d{2})/);
  if (!match) return null;

  const year = 2000 + parseInt(match[1]);
  const monthStr = MONTH_MAP[match[2]];
  const day = parseInt(match[3]);

  const monthIndex = new Date(`${monthStr} 1, ${year}`).getMonth();

  return new Date(year, monthIndex, day);
}
function formatHolidayDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function isHoliday(date, holidaysFO) {
  let formatted = formatDate(date);
     if(formatted ===undefined ){
            formatted = formatHolidayDate(date);
      }
  return holidaysFO.some(h => h.tradingDate === formatted);
}

function getPreviousWorkingDay(date, holidaysFO) {
  const d = new Date(date);

  while (true) {
    d.setDate(d.getDate() - 1);

    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    if (!isWeekend && !isHoliday(d, holidaysFO)) {
      return d;
    }
  }
}

function rebuildSymbolWithNewDate(symbol, newDate) {
  const match = symbol.match(/(NIFTY)(\d{2})([A-Z])(\d{2})(\d+)(CE|PE)/);
  if (!match) return symbol;

  const prefix = match[1];
  const year = match[2];
  const monthCode = match[3];
  const strike = match[5];
  const type = match[6];

  const newDay = String(newDate.getDate()).padStart(2, "0");

  return `${prefix}${year}${monthCode}${newDay}${strike}${type}`;
}
export function adjustForHoliday(date, holidaysFO) {
  const d = new Date(date);

  while (true) {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    if (!isWeekend && !isHoliday(d, holidaysFO)) {
      return d;
    }

    // 🔥 move backward
    d.setDate(d.getDate() - 1);
  }
}
export function adjustExpiryAndRebuild(total_array_expiries, holidaysFO) {
  const updated = {};

  for (const [key, arr] of Object.entries(total_array_expiries)) {
    if (!arr?.length) continue;

    const updatedRows = [];

    for (const row of arr) {
      const symbol = row.symbol;
      if (!symbol) continue;

      const expiryDate = parseSymbolToDate(symbol);
      if (!expiryDate) {
        updatedRows.push(row);
        continue;
      }

      if (isHoliday(expiryDate, holidaysFO)) {
        console.log(`🚫 Holiday expiry detected: ${formatDate(expiryDate)}`);

        const newDate = getPreviousWorkingDay(expiryDate, holidaysFO);

        console.log(`✅ Shifted to: ${formatDate(newDate)}`);

        const newSymbol = rebuildSymbolWithNewDate(symbol, newDate);

        updatedRows.push({
          ...row,
          symbol: newSymbol
        });

      } else {
        updatedRows.push(row);
      }
    }

    updated[key] = updatedRows;
  }

  return updated;
}