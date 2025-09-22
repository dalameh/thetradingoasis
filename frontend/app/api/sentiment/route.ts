// app/api/sentiment/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("Sentiment API HIT!");
    // 1. Get headlines, ticker, and min_confidence from request
    const { headlines, ticker, min_confidence } = await req.json();

    if (!headlines || !Array.isArray(headlines) || headlines.length === 0) {
      return NextResponse.json({ error: "No headlines provided" }, { status: 400 });
    }
    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }
    
    const SENTIMENT_SERVICE_URL = process.env.SENTIMENT_API_URL;
    
    // 2. Call your deployed Python backend on Render
    const response = await fetch(`${SENTIMENT_SERVICE_URL}/api/sentiment`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": process.env.SENTIMENT_API_KEY || ""  // include your API key
      },
      body: JSON.stringify({ 
        headlines,
        ticker,
        min_confidence: min_confidence ?? 0.7  // default to 0.7 if not provided
      }),
    });

    console.log("Sentiment API", response);
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    // 3. Return results to frontend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}