import { NextResponse } from "next/server";
import yahoofinance from "yahoo-finance2";

const intradayIntervals = new Set(["1m", "5m", "15m", "30m", "1h"]);

interface YahooQuote {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface YahooChartData {
  quotes: YahooQuote[];
  meta: Record<string, unknown>;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ticker = url.searchParams.get("ticker") || "SPY";
  let interval = url.searchParams.get("interval") || "1d";
  const start = url.searchParams.get("start") || "2021-01-01";
  const end = url.searchParams.get("end") || undefined;

  const validIntervals = [...intradayIntervals, "1d", "1wk", "1mo", "3mo"];
  if (!validIntervals.includes(interval)) interval = "1d";

  try {
    if (intradayIntervals.has(interval)) {
      const now = Date.now();
      const maxIntradayRangeMs = interval === "1m" ? 8 * 24 * 60 * 60 * 1000 : 59 * 24 * 60 * 60 * 1000;

      let startDate = new Date(start);
      if (now - startDate.getTime() > maxIntradayRangeMs) {
        startDate = new Date(now - maxIntradayRangeMs);
      }

      let endDate = end ? new Date(end) : new Date(now);
      if (endDate.getTime() > now) endDate = new Date(now);
      if (endDate.getTime() - startDate.getTime() > maxIntradayRangeMs) {
        endDate = new Date(startDate.getTime() + maxIntradayRangeMs);
      }

      const options = {
        interval: interval as
          | "1m"
          | "5m"
          | "15m"
          | "30m"
          | "1h",
        period1: Math.floor(startDate.getTime() / 1000),
        period2: Math.floor(endDate.getTime() / 1000),
        includePrePost: false,
        return: "object" as const, // ✅ Required by TS
      };

      const data = await yahoofinance.chart(ticker, options);
      const typedData = data as unknown as YahooChartData;

      const formatted = typedData.quotes
        .filter(d => typeof d.open === "number")
        .map(d => ({
          time: Math.floor(new Date(d.date).getTime() / 1000),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume ?? 0,
        }));

      return NextResponse.json(formatted);
    } else {
      const options: {
        interval?: "1d" | "1wk" | "1mo";
        period1: string | number | Date;
        period2?: string | number | Date;
        events?: "history" | "dividends" | "split";
      } = {
        interval: interval as "1d" | "1wk" | "1mo",
        period1: start,
      };

      if (end) options.period2 = end;

      const historical = await yahoofinance.historical(ticker, options);

      if (!Array.isArray(historical)) throw new Error("Invalid historical data");

      const formatted = historical.map(d => ({
        time: Math.floor(new Date(d.date).getTime() / 1000),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      }));

      return NextResponse.json(formatted);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
