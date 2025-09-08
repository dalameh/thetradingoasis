import { NextResponse } from 'next/server';
import { updateTickers } from '../../../lib/scrapeTopTickers';

export async function GET() {
  try {
    await updateTickers();
    return NextResponse.json({ message: "Tickers updated" });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update tickers: ${String(error)}` },
      { status: 500 }
    );
  }
}