import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    if (!process.env.FINNHUB_API_KEY) {
      return NextResponse.json(
        { error: "Finnhub API key not set" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing 'from' or 'to' query parameters" },
        { status: 400 }
      );
    }

    // Construct Finnhub URL
    const url = new URL("https://finnhub.io/api/v1/calendar/earnings");
    url.searchParams.append("from", from);
    url.searchParams.append("to", to);
    url.searchParams.append("token", process.env.FINNHUB_API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Finnhub API error: ${res.status}`);
    }

    const data = await res.json();
    
    return NextResponse.json(data);
    
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to fetch earnings" },
        { status: 500 }
      );
    }
  }
}