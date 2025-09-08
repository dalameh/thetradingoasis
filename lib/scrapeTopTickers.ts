// import fetch from "node-fetch";
// import * as cheerio from "cheerio";
// import { supabaseServer } from '@/lib/supabaseServerSideClient';

// const wikiSources = [
//   {
//     url: "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
//     tableId: "#constituents",
//     supabaseTable: "sp500_tickers",
//   },
//   {
//     url: "https://en.wikipedia.org/wiki/NASDAQ-100",
//     tableId: "#constituents",
//     supabaseTable: "nd100_tickers",
//   },
//   {
//     url: "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average",
//     tableId: "#constituents",
//     supabaseTable: "djia_tickers",
//   },
// ];

// // Helper to parse a Wikipedia table row to ticker and company name
// async function parseTable(url: string, selector: string) {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Failed to fetch ${url}`);

//   const html = await res.text();
//   const $ = cheerio.load(html);

//   const rows = $(selector).find("tbody tr").slice(1); // skip header

//   const tickers: { ticker: string; company_name: string }[] = [];

//   rows.each((_, el) => {
//     const cells = $(el).find("td");
//     if (cells.length < 2) return; // skip invalid rows

//     // Different pages may have ticker and company columns in different order:
//     // For S&P 500: ticker is first td, company second td
//     // For Nasdaq-100: ticker usually 2nd td, company 1st td
//     // For DJIA: ticker usually 2nd td, company 1st td

//     let ticker = "";
//     let company = "";

//     if (url.includes("S%26P_500")) {
//       ticker = $(cells[0]).text().trim();
//       company = $(cells[1]).text().trim();
//     } else if (url.includes("NASDAQ-100")) {
//       ticker = $(cells[1]).text().trim();
//       company = $(cells[0]).text().trim();
//     } else if (url.includes("Dow_Jones_Industrial_Average")) {
//       ticker = $(cells[1]).text().trim();
//       company = $(cells[0]).text().trim();
//     }

//     // Clean ticker e.g. remove footnotes [1]
//     ticker = ticker.replace(/\[\d+\]/g, "").toUpperCase();

//     if (ticker && company) {
//       tickers.push({ ticker, company_name: company });
//     }
//   });

//   return tickers;
// }

// // Main function to update Supabase tables with scraped tickers
// export async function updateTickers() {
//   for (const source of wikiSources) {
//     try {
//       const tickers = await parseTable(source.url, source.tableId);

//       // Upsert all tickers to the appropriate table
//       for (const t of tickers) {
//         await supabaseServer
//           .from(source.supabaseTable)
//           .upsert({
//             ticker: t.ticker,
//             company_name: t.company_name,
//             last_updated: new Date().toISOString(),
//           }, { onConflict: "ticker" });
//       }
//     } catch (error) {
//       console.error(`Failed to update ${source.supabaseTable}:`, error);
//     }
//   }
// }
