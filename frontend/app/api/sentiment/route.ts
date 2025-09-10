// app/api/sentiment/route.ts
export async function GET() {
  return new Response(JSON.stringify({ message: "API not available" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// // app/api/sentiment/route.ts
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     // 1. Get headlines from request
//     const { headlines } = await req.json();

//     if (!headlines || !Array.isArray(headlines) || headlines.length === 0) {
//         return NextResponse.json({ error: "No headlines provided" }, { status: 400 });
//     }

//     // 2. Call your Python backend
//     const response = await fetch("http://localhost:8000/api/sentiment", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ headlines }),
//     });

//     if (!response.ok) {
//       throw new Error(`Backend error: ${response.statusText}`);
//     }

//     // 3. Return results to frontend
//     const data = await response.json();
//     return NextResponse.json(data);

//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
