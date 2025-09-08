import { NextResponse } from "next/server";
import yahoofinance from "yahoo-finance2";

// Intervals < 1d are intraday
const intradayIntervals = new Set([
  "1m", "5m", "15m", "30m", "1h"
]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ticker = url.searchParams.get("ticker") || "SPY";
  let interval = url.searchParams.get("interval") || "1d"
  const start = url.searchParams.get("start") || "2021-01-01";
  const end = url.searchParams.get("end");
  
  // Sanitize interval
  const validIntervals = [
    ...intradayIntervals,
    "1d", "1wk", "1mo", "3mo"
  ];
  if (!validIntervals.includes(interval)) {
    interval = "1d";
  }

  try {

    if (intradayIntervals.has(interval)) {
      console.log("Fetching intraday data...");
      // Intraday intervals use UNIX timestamps
      
      const now = Date.now();
      let maxIntradayRangeMs = 0.0;
      if (interval == "1m") {
          maxIntradayRangeMs = 8 * 24 * 60 * 60 * 1000; // 8 days in ms
      } else {
          maxIntradayRangeMs = 59 * 24 * 60 * 60 * 1000; // 59 days in ms
      }
      let startDate = new Date(start);

      // Clamp start date to max 60 days ago from now
      if (now - startDate.getTime() > maxIntradayRangeMs) {
        startDate = new Date(now - maxIntradayRangeMs);
        console.log(`Intraday start date too far back, resetting to ${startDate.toISOString().slice(0, 10)}`);
      }

      let endDate = end ? new Date(end) : new Date(now);

      // Clamp end date to now
      if (endDate.getTime() > now) {
        endDate = new Date(now);
      }

      // Clamp range to max 60 days from startDate
      if (endDate.getTime() - startDate.getTime() > maxIntradayRangeMs) {
        endDate = new Date(startDate.getTime() + maxIntradayRangeMs);
        console.log(`Intraday end date too far ahead, resetting to ${endDate.toISOString().slice(0, 10)}`);
      }

      const period1 = Math.floor(startDate.getTime() / 1000);
      const period2 = Math.floor(endDate.getTime() / 1000);

      const options: any = {
        interval,
        period1,
        period2,
        includePrePost: false, 
      };

      const data = await yahoofinance.chart(ticker, options);

      //  if (!Array.isArray(data)) {
      //   throw new Error("Invalid historical data");
      // }

      const typedData = data as unknown as { 
        quotes: Array<{ date: string | Date; open: number; high: number; low: number; close: number; volume: number }>; 
        meta: any;
      };

      const formatted = typedData.quotes
      .filter(d => 
        typeof d.open === "number" &&
        typeof d.high === "number" &&
        typeof d.low === "number" &&
        typeof d.close === "number"
      )
      .map(d => ({
        time: Math.floor(new Date(d.date).getTime() / 1000),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume ?? 0,
      }));
      console.log(formatted);


      return NextResponse.json(formatted);

    } else {
      // Use yf.historical for daily and longer intervals
      const options: any = { interval, period1: start };
      if (end) options.period2 = end;

      const historical = await yahoofinance.historical(ticker, options);
      // console.log(historical);

      if (!Array.isArray(historical)) {
        throw new Error("Invalid historical data");
      }

      const formatted = historical.map((d) => ({
        time: Math.floor(new Date(d.date).getTime() / 1000),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      }));

      return NextResponse.json(formatted);
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: (error as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}
