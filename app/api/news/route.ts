// using google api

import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { JSDOM } from 'jsdom';

const parser = new Parser();

function parseContent(contentHtml: string) {
  if (!contentHtml) return { description: '', source: '' };
  const dom = new JSDOM(contentHtml);
  const aTag = dom.window.document.querySelector('a');
  const fontTag = dom.window.document.querySelector('font');
  return {
    description: aTag?.textContent?.trim() || '',
    source: fontTag?.textContent?.trim() || '',
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');

  
  if (!company) {
    return NextResponse.json({ error: 'Missing company parameter' }, { status: 400 });
  }

  try {
    // Google News RSS feed URL for the company/ticker
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(company)}&hl=en-US&gl=US&ceid=US:en`;
    const feed = await parser.parseURL(feedUrl);
    // console.log(feed);

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // timestamp for 24 hours ago
    // Map and clean results
    const simplified = feed.items.map(item => {
      const { source } = parseContent(item.content || '');
      const dateObj = new Date(item.isoDate || item.pubDate || '');

      return {
        title: item.title || '',
        url: item.link || '',
        description: item.contentSnippet || '',
        // date: dateObj ? dateObj.toLocaleString() : '',
        dateObj,
        source: source || '',
      };
    })
    .filter(item => item.dateObj && item.dateObj.getTime() >= oneDayAgo) // filter with Date
      .map(item => ({
        ...item,
        date: item.dateObj ? item.dateObj.toLocaleString() : '',
      }));
    return NextResponse.json({ news: simplified });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch news' }, { status: 500 });
  }
}

// using backend news.py

// app/api/news/route.ts
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const company = searchParams.get("company") || "S&P500";
//   const daysBack = searchParams.get("daysBack") || "2";

//   // if (!company) {
//   //   return NextResponse.json(
//   //     { error: "Missing 'company' query parameter" },
//   //     { status: 400 }
//   //   );
//   // }

//   try {
//     const query = new URLSearchParams({ company, daysBack });

//     const res = await fetch(`http://localhost:8000/api/news?${query.toString()}`);
//     console.log(res);

//     if (!res.ok) {
//       throw new Error(`Backend API error: ${res.status}`);
//     }

//     const data = await res.json();

//     // Pass through the backend's "news" array exactly as is
//     return NextResponse.json({
//       news: data.news.map((item: any) => ({
//         title: item.title,
//         description: item.description, // use the actual description from backend
//         source: item.source,
//         date: item.date,
//         url: item.url,
//       })),
//     });
//   } catch (error: any) {
//     return NextResponse.json(
//       { error: error.message || "Failed to fetch news" },
//       { status: 500 }
//     );
//   }
// }