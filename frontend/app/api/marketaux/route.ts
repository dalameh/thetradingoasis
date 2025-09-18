// import { NextRequest, NextResponse } from "next/server";
// import yahooFinance from "yahoo-finance2";

// export async function GET(req: NextRequest) {
//   try {
//     const techStocks = ["AAPL", "MSFT", "GOOGL", "META", "AMZN"];

//     // Fetch recommendations for each stock
//     const recommendationsPromises = techStocks.map((symbol) =>
//       yahooFinance.recommendationsBySymbol(symbol)
//     );

//     const techRecs = await Promise.all(recommendationsPromises);

//     // Count recommended symbols across all tech stocks
//     const recCounts = new Map<string, number>();

//     techRecs.forEach((result) => {
//       result.recommendedSymbols.forEach((rec) => {
//         // Only count symbols not in the original techStocks list
//         if (!techStocks.includes(rec.symbol)) {
//           recCounts.set(rec.symbol, (recCounts.get(rec.symbol) || 0) + 1);
//         }
//       });
//     });

//     // Sort by frequency and take top 10
//     const commonRecs = Array.from(recCounts.entries())
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, 10)
//       .map(([symbol, count]) => ({ symbol, count }));

//     return NextResponse.json({ commonRecs });
//   } catch (error) {
//     console.error("Error fetching tech recommendations:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch tech stock recommendations." },
//       { status: 500 }
//     );
//   }
// }


// // api/marketaux/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import yahooFinance from "yahoo-finance2"; // default import

// export async function GET(request: NextRequest) {
//   try {
//     // const { searchParams } = new URL(request.url);
//     // const symbol = searchParams.get("symbol");

//     // if (!symbol) {
//     //   return NextResponse.json(
//     //     { error: "Missing 'symbol' query parameter" },
//     //     { status: 400 }
//     //   );
//     // }

//     // Correct usage: call via default import as a function
//     const recommendations = await yahooFinance.recommendationsBySymbol("AMC");

//     const result = {
//         symbol: recommendations.symbol,
//         recommendedSymbols: recommendations.recommendedSymbols.map((rec) => ({
//             symbol: rec.symbol,
//             score: rec.score,
//         })),
//         };


//     return NextResponse.json(result);
//   } catch (error) {
//     console.error("Error fetching recommendations:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch recommendations" },
//       { status: 500 }
//     );
//   }
// }
