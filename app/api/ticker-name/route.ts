import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("ticker");

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol parameter" }, { status: 400 });
  }

  try {
    // Fetch quote summary (includes profile info)
    const data = await yahooFinance.quoteSummary(symbol, { modules: ["price"] });

    // Company name lives inside price.longName
    const name = data.price?.longName || data.price?.shortName || symbol;

    return NextResponse.json({ name });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch company name" }, { status: 500 });
  }
}