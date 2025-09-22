// app/api/hmmpot/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "SPY";
  const interval = searchParams.get("interval") || "1d";
  const start = searchParams.get("start") || "2021-01-01";

  try {
    const query = new URLSearchParams({ symbol, interval, start });

    const res = await fetch(`${process.env.HMM_API_URL}/api/hmmplot?${query.toString()}`);
    const data = await res.json() as { figure: object; regime_stats: object; curr_regime: string };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    let message = "Failed to fetch plot data";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
