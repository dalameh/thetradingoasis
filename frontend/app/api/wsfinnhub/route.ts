import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.FINNHUB_API_KEY; // make sure this exists in .env
  if (!token) return NextResponse.json({ error: 'No API key' }, { status: 400 });

  return NextResponse.json({
    wsUrl: `wss://ws.finnhub.io?token=${token}`
  });
}
