import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import readline from 'node:readline';

// In ESM, __filename and __dirname are not defined. We derive them here:
const __filename = fileURLToPath(import.meta.url);

/**
 * WORKER LOGIC
 */
if (!isMainThread) {
  const { url } = workerData;
  const records = [];

  https.get(url, (res) => {
    const rl = readline.createInterface({
      input: res,
      terminal: false
    });

    rl.on('line', (line) => {
      const parts = line.split(',');
      if (parts.length > 1) {
        records.push({
          id: parts[0],
          symbol: parts[1], 
          fyersToken: parts[9],
          strike: parts[15],
          type: parts[16]
        });
      }
    });

    rl.on('close', () => {
      parentPort.postMessage(records);
    });
  }).on('error', (err) => {
    parentPort.postMessage({ error: err.message });
  });
}

/**
 * MAIN THREAD LOGIC
 */
export async function loadSymbols() {
  const sources = [
    'https://public.fyers.in/sym_details/BSE_FO.csv',
    'https://public.fyers.in/sym_details/NSE_FO.csv'
  ];

  console.log("🚀 Initializing multi-threaded parsing (ESM Mode)...");

  const fetchSource = (url) => new Promise((resolve, reject) => {
    const worker = new Worker(__filename, { 
      workerData: { url } 
    });
    
    worker.on('message', (data) => {
      if (data.error) reject(data.error);
      else resolve(data);
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });

  try {
    const startTime = Date.now();
    const results = await Promise.all(sources.map(fetchSource));
    const allSymbols = results.flat();
    
    console.log(`✅ Loaded ${allSymbols.length.toLocaleString()} records in ${Date.now() - startTime}ms`);
    
    return allSymbols;
  } catch (error) {
    console.error("❌ Processing failed:", error);
    throw error;
  }
}

export async function search (query , allSymbols )  {
       const start = Date.now();
      const filtered = allSymbols.filter(s => 
        s.symbol.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
      return { length :filtered.length ,   results: filtered, time: Date.now() - start };

}

// Self-execute if run directly
if (isMainThread && process.argv[1] === __filename) {
  loadSymbols();
}