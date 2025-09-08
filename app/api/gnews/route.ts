// import { NextResponse } from 'next/server';

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const company = searchParams.get('company') || '';
//     const maxResults = searchParams.get('max') || '5';

//     if (!process.env.GNEWS_API_KEY) {
//       return NextResponse.json(
//         { error: 'Missing GNEWS_API_KEY in environment variables' },
//         { status: 500 }
//       );
//     }

//     const res = await fetch(`https://gnews.io/api/v4/top-headlines?topic=business&lang=en&country=us&token=${process.env.GNEWS_API_KEY}`);
//     if (!res.ok) {
//       return NextResponse.json(
//         { error: `GNews API error: ${res.status}` },
//         { status: res.status }
//       );
//     }

//     const data = await res.json();

//     if (!data.articles || data.articles.length === 0) {
//       return NextResponse.json({ news: [], message: "No news found" });
//     }

//     const news = data.articles.map((item: any) => ({
//         title: item.title,
//         description: item.description,
//         content: item.content,
//         url: item.url,
//         image: item.image,
//         date: item.publishedAt,
//         source: item.source?.name || ''
//     }));

//     return NextResponse.json({ news });
//   } catch (err: any) {
//     return NextResponse.json(
//       { error: err.message || 'Internal Server Error' },
//       { status: 500 }
//     );
//   }
// }
