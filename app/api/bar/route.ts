// app/api/bar/route.ts
import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    const timestampStr = searchParams.get("timestamp");

    if (!symbol || !timestampStr) {
      return NextResponse.json({ error: "Missing symbol or timestamp" }, { status: 400 });
    }

    const entryUnix = parseInt(timestampStr, 10) * 1000; // ms
    const entryDate = new Date(entryUnix);

    // Round seconds/milliseconds to 0
    entryDate.setSeconds(0, 0);

    const now = new Date();
    const currentMinute = new Date(now);
    currentMinute.setSeconds(0, 0);

    // If the entry is in the current live minute, shift back 1 min
    if (entryDate.getTime() === currentMinute.getTime()) {
      entryDate.setMinutes(entryDate.getMinutes() - 1);
    }

    // Use entryDate as the bar reference
    const from = new Date(entryDate);
    const to = new Date(entryDate);
    to.setMinutes(to.getMinutes() + 1);

    const bars = await yahooFinance.chart(symbol, {
      interval: "1m",
      period1: from,
      period2: to,
    });

    if (!bars.quotes || bars.quotes.length === 0) {
      return NextResponse.json({ error: "No bar data found" }, { status: 404 });
    }

    const bar = bars.quotes[0];
    console.log(bar);

    // Return the actual bar datetime from Yahoo
    return NextResponse.json({
      date: bar.date, // ✅ use bar.date, not timestamp
      open: bar.open ?? null,
      high: bar.high ?? null,
      low: bar.low ?? null,
      close: bar.close ?? null,
      volume: bar.volume ?? null,
    });


  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
