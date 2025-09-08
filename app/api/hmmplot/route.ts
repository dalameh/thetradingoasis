// app/api/hmmpot/route.ts
export async function GET() {
  return new Response(JSON.stringify({ message: "API not available" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}


// import { NextResponse } from "next/server";

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const symbol = searchParams.get("symbol") || "SPY";
//   const interval = searchParams.get("interval") || "1d";
//   const start = searchParams.get("start") || "2021-01-01";

//   try {
//     const query = new URLSearchParams({ symbol, interval, start });
//     const res = await fetch(`http://localhost:8001/api/hmmplot?${query.toString()}`);
//     const data = await res.json();  // contains { figure, regime_stats }

//     return NextResponse.json(data, { status: 200 });
//   } catch (error: any) {
//     return NextResponse.json(
//       { error: error.message || "Failed to fetch plot data" },
//       { status: 500 }
//     );
//   }
// }
