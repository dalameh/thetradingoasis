import { NextResponse } from "next/server";
import yahoofinance from "yahoo-finance2";

// Intervals
type IntradayInterval = "1m" | "5m" | "15m" | "30m" | "1h";
type HistoricalInterval = "1d" | "1wk" | "1mo";

const intradayIntervals: IntradayInterval[] = [
  "1m", "5m", "15m", "30m", "1h",
];
const historicalIntervals: HistoricalInterval[] = [
  "1d", "1wk", "1mo",
];

// Minimal types for results
interface ChartQuote {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ChartResult {
  quotes: ChartQuote[];
  meta?: Record<string, unknown>;
}

interface HistoricalResult {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Type guard for chart response
function isChartResult(obj: unknown): obj is ChartResult {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "quotes" in obj &&
    Array.isArray((obj as { quotes?: unknown }).quotes)
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ticker = url.searchParams.get("ticker") || "SPY";
  let interval = url.searchParams.get("interval") || "1d";
  const start = url.searchParams.get("start") || "2021-01-01";
  const end = url.searchParams.get("end");

  try {
    // ----- Intraday -----
    if (intradayIntervals.includes(interval as IntradayInterval)) {
      const safeInterval = interval as IntradayInterval;
      const now = Date.now();
      const maxRangeMs =
        safeInterval === "1m"
          ? 8 * 24 * 60 * 60 * 1000
          : 59 * 24 * 60 * 60 * 1000;

      let startDate = new Date(start);
      if (now - startDate.getTime() > maxRangeMs) {
        startDate = new Date(now - maxRangeMs);
      }

      let endDate = end ? new Date(end) : new Date(now);
      if (endDate.getTime() > now) endDate = new Date(now);
      if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
        endDate = new Date(startDate.getTime() + maxRangeMs);
      }

      const options = {
        interval: safeInterval,
        period1: Math.floor(startDate.getTime() / 1000),
        period2: Math.floor(endDate.getTime() / 1000),
        includePrePost: false,
      };

      const result = await yahoofinance.chart(ticker, options);

      if (!isChartResult(result)) {
        throw new Error("Invalid chart response");
      }

      const formatted = result.quotes
        .filter(
          (q) =>
            typeof q.open === "number" &&
            typeof q.high === "number" &&
            typeof q.low === "number" &&
            typeof q.close === "number"
        )
        .map((q) => ({
          time: Math.floor(new Date(q.date).getTime() / 1000),
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          volume: q.volume ?? 0,
        }));

      return NextResponse.json(formatted);
    }

    // ----- Historical -----
    const safeInterval: HistoricalInterval =
      historicalIntervals.includes(interval as HistoricalInterval)
        ? (interval as HistoricalInterval)
        : "1d";

    const options: {
      interval: HistoricalInterval;
      period1: string;
      period2?: string;
    } = {
      interval: safeInterval,
      period1: start,
    };
    if (end) options.period2 = end;

    const historical: HistoricalResult[] = await yahoofinance.historical(
      ticker,
      options
    );

    const formatted = historical.map((d) => ({
      time: Math.floor(new Date(d.date).getTime() / 1000),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
